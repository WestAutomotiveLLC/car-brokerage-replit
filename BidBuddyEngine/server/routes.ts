import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireCustomer, requireEmployee, requireSuperAdmin } from "./replitAuth";
import { insertBidSchema, updateBidStatusSchema } from "@shared/schema";
import { stripeService } from "./stripeService";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Company code for employee registration (in production, this should be in env var or database)
const COMPANY_CODE = process.env.COMPANY_CODE || "0037";

export async function registerRoutes(
  app: Express
): Promise<Server> {
  // Set up Replit Auth
  await setupAuth(app);

  // Auth route - get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Onboarding - complete user profile
  app.post('/api/onboarding/complete', isAuthenticated, upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'addressDocument', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { userType, companyCode } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Validate user type
      if (!['customer', 'employee'].includes(userType)) {
        return res.status(400).json({ message: "Invalid user type" });
      }

      // Employee validation
      if (userType === 'employee') {
        if (!companyCode || companyCode !== COMPANY_CODE) {
          return res.status(400).json({ message: "Invalid company code" });
        }
      }

      // Customer validation
      if (userType === 'customer') {
        if (!files?.idDocument || !files?.addressDocument) {
          return res.status(400).json({ message: "ID and address documents are required" });
        }
      }

      // Update user
      const updateData: any = {
        userType,
      };

      if (userType === 'employee') {
        updateData.companyCode = companyCode;
        updateData.isVerified = true; // Auto-verify employees
      }

      if (userType === 'customer' && files) {
        updateData.idDocumentUrl = files.idDocument?.[0]?.filename;
        updateData.addressDocumentUrl = files.addressDocument?.[0]?.filename;
        updateData.isVerified = true; // Auto-verify for now (in production, would require manual review)
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.upsertUser({
        ...user,
        ...updateData,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Customer routes
  // Get customer's bids
  app.get('/api/customer/bids', isAuthenticated, requireCustomer, async (req: any, res) => {
    try {
      const customerId = req.currentUser.id;
      const customerBids = await storage.getBidsByCustomer(customerId);
      res.json(customerBids);
    } catch (error) {
      console.error("Error fetching bids:", error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  // Create a new bid
  app.post('/api/customer/bids', isAuthenticated, requireCustomer, async (req: any, res) => {
    try {
      const validatedData = insertBidSchema.parse(req.body);
      const customerId = req.currentUser.id;

      const bid = await storage.createBid({
        ...validatedData,
        customerId,
        status: "pending",
        isRefunded: false,
      });

      res.status(201).json(bid);
    } catch (error: any) {
      console.error("Error creating bid:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid bid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bid" });
    }
  });

  // Create payment intent for bid
  app.post('/api/customer/bids/:bidId/create-payment-intent', isAuthenticated, requireCustomer, async (req: any, res) => {
    try {
      const { bidId } = req.params;
      const bid = await storage.getBid(bidId);

      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }

      // Verify bid belongs to customer
      if (bid.customerId !== req.currentUser.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Check if payment already exists
      if (bid.stripePaymentIntentId) {
        const existingIntent = await stripeService.getPaymentIntent(bid.stripePaymentIntentId);
        return res.json({ clientSecret: existingIntent.client_secret });
      }

      // Create payment intent
      const paymentIntent = await stripeService.createPaymentIntent(
        Number(bid.totalPaid),
        'usd',
        {
          bidId: bid.id,
          customerId: bid.customerId,
          lotNumber: bid.lotNumber,
        }
      );

      // Update bid with payment intent ID
      await storage.updateBidPaymentInfo(bidId, {
        stripePaymentIntentId: paymentIntent.id,
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Process refund for losing bid
  app.post('/api/employee/bids/:bidId/refund', isAuthenticated, requireEmployee, async (req: any, res) => {
    try {
      const { bidId } = req.params;
      const bid = await storage.getBid(bidId);

      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }

      // Only refund outbid or lost bids
      if (bid.status !== "outbid" && bid.status !== "lost") {
        return res.status(400).json({ message: "Only outbid or lost bids can be refunded" });
      }

      if (bid.isRefunded) {
        return res.status(400).json({ message: "Bid has already been refunded" });
      }

      const refund = await stripeService.refundBidPayment(bidId);
      res.json({ message: "Refund processed successfully", refund });
    } catch (error: any) {
      console.error("Error processing refund:", error);
      res.status(500).json({ message: error.message || "Failed to process refund" });
    }
  });

  // Get single bid details
  app.get('/api/customer/bids/:bidId', isAuthenticated, requireCustomer, async (req: any, res) => {
    try {
      const { bidId } = req.params;
      const bid = await storage.getBid(bidId);

      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }

      // Verify the bid belongs to the customer
      if (bid.customerId !== req.currentUser.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(bid);
    } catch (error) {
      console.error("Error fetching bid:", error);
      res.status(500).json({ message: "Failed to fetch bid" });
    }
  });

  // Get bid history
  app.get('/api/customer/bids/:bidId/history', isAuthenticated, requireCustomer, async (req: any, res) => {
    try {
      const { bidId } = req.params;
      const bid = await storage.getBid(bidId);

      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }

      // Verify the bid belongs to the customer
      if (bid.customerId !== req.currentUser.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const history = await storage.getBidHistory(bidId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching bid history:", error);
      res.status(500).json({ message: "Failed to fetch bid history" });
    }
  });

  // Employee routes
  // Get all bids (for employees and admins)
  app.get('/api/employee/bids', isAuthenticated, requireEmployee, async (req: any, res) => {
    try {
      const allBids = await storage.getAllBids();
      res.json(allBids);
    } catch (error) {
      console.error("Error fetching bids:", error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  // Approve a bid
  app.post('/api/employee/bids/:bidId/approve', isAuthenticated, requireEmployee, async (req: any, res) => {
    try {
      const { bidId } = req.params;
      const employeeId = req.currentUser.id;

      const bid = await storage.getBid(bidId);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }

      if (bid.status !== "pending") {
        return res.status(400).json({ message: "Only pending bids can be approved" });
      }

      const approvedBid = await storage.approveBid(bidId, employeeId);
      res.json(approvedBid);
    } catch (error) {
      console.error("Error approving bid:", error);
      res.status(500).json({ message: "Failed to approve bid" });
    }
  });

  // Reject a bid
  app.post('/api/employee/bids/:bidId/reject', isAuthenticated, requireEmployee, async (req: any, res) => {
    try {
      const { bidId } = req.params;
      const { notes } = req.body;
      const employeeId = req.currentUser.id;

      if (!notes || !notes.trim()) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const bid = await storage.getBid(bidId);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }

      if (bid.status !== "pending") {
        return res.status(400).json({ message: "Only pending bids can be rejected" });
      }

      const rejectedBid = await storage.rejectBid(bidId, employeeId, notes);
      res.json(rejectedBid);
    } catch (error) {
      console.error("Error rejecting bid:", error);
      res.status(500).json({ message: "Failed to reject bid" });
    }
  });

  // Update bid status
  app.patch('/api/employee/bids/:bidId/status', isAuthenticated, requireEmployee, async (req: any, res) => {
    try {
      const { bidId } = req.params;
      const validatedData = updateBidStatusSchema.parse(req.body);
      const employeeId = req.currentUser.id;

      const bid = await storage.getBid(bidId);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }

      const updatedBid = await storage.updateBidStatus(
        bidId,
        validatedData.status,
        employeeId,
        validatedData.notes
      );

      res.json(updatedBid);
    } catch (error: any) {
      console.error("Error updating bid status:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid status update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update bid status" });
    }
  });

  // Delete a bid (for completed auctions)
  app.delete('/api/employee/bids/:bidId', isAuthenticated, requireEmployee, async (req: any, res) => {
    try {
      const { bidId } = req.params;

      const bid = await storage.getBid(bidId);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }

      // Only allow deletion of won or lost bids
      if (bid.status !== "won" && bid.status !== "lost") {
        return res.status(400).json({ message: "Only won or lost bids can be deleted" });
      }

      await storage.deleteBid(bidId);
      res.json({ message: "Bid deleted successfully" });
    } catch (error) {
      console.error("Error deleting bid:", error);
      res.status(500).json({ message: "Failed to delete bid" });
    }
  });

  // Super Admin routes
  // Get all employees
  app.get('/api/admin/employees', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const employees = await storage.getUsersByType("employee");
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  // Delete employee account (soft delete - marks as inactive)
  app.delete('/api/admin/employees/:employeeId', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { employeeId } = req.params;
      const superAdminId = req.currentUser.id;

      const employee = await storage.getUser(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      if (employee.userType !== "employee") {
        return res.status(400).json({ message: "Can only delete employee accounts" });
      }

      // Soft delete - mark as inactive
      await storage.updateUserStatus(employeeId, false);

      // Log the action
      await storage.createEmployeeAction({
        employeeId,
        actionType: "deleted",
        performedBy: superAdminId,
        notes: "Employee account deactivated by super admin",
      });

      res.json({ message: "Employee account deleted successfully" });
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Get employee actions (audit log)
  app.get('/api/admin/employees/:employeeId/actions', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { employeeId } = req.params;
      const actions = await storage.getEmployeeActions(employeeId);
      res.json(actions);
    } catch (error) {
      console.error("Error fetching employee actions:", error);
      res.status(500).json({ message: "Failed to fetch employee actions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
