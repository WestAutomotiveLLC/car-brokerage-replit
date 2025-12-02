import {
  users,
  bids,
  bidHistory,
  employeeActions,
  type User,
  type UpsertUser,
  type Bid,
  type BidHistory,
  type EmployeeAction,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByType(userType: string): Promise<User[]>;
  updateUserStatus(userId: string, isActive: boolean): Promise<User | undefined>;

  // Bid operations
  createBid(bid: Omit<Bid, "id" | "createdAt" | "updatedAt">): Promise<Bid>;
  getBid(bidId: string): Promise<Bid | undefined>;
  getBidsByCustomer(customerId: string): Promise<Bid[]>;
  getAllBids(): Promise<Bid[]>;
  updateBidStatus(bidId: string, status: string, employeeId: string, notes?: string): Promise<Bid | undefined>;
  approveBid(bidId: string, employeeId: string): Promise<Bid | undefined>;
  rejectBid(bidId: string, employeeId: string, notes: string): Promise<Bid | undefined>;
  updateBidPaymentInfo(bidId: string, paymentInfo: {
    stripePaymentIntentId?: string;
    stripeDepositRefundId?: string;
    stripeFeeRefundId?: string;
    isRefunded?: boolean;
  }): Promise<Bid | undefined>;
  deleteBid(bidId: string): Promise<void>;

  // Bid history operations
  createBidHistoryEntry(entry: Omit<BidHistory, "id" | "createdAt">): Promise<BidHistory>;
  getBidHistory(bidId: string): Promise<BidHistory[]>;

  // Employee action operations
  createEmployeeAction(action: Omit<EmployeeAction, "id" | "createdAt">): Promise<EmployeeAction>;
  getEmployeeActions(employeeId: string): Promise<EmployeeAction[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByType(userType: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.userType, userType));
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Bid operations
  async createBid(bidData: Omit<Bid, "id" | "createdAt" | "updatedAt">): Promise<Bid> {
    const [bid] = await db.insert(bids).values(bidData).returning();
    return bid;
  }

  async getBid(bidId: string): Promise<Bid | undefined> {
    const [bid] = await db.select().from(bids).where(eq(bids.id, bidId));
    return bid;
  }

  async getBidsByCustomer(customerId: string): Promise<Bid[]> {
    return await db
      .select()
      .from(bids)
      .where(eq(bids.customerId, customerId))
      .orderBy(desc(bids.createdAt));
  }

  async getAllBids(): Promise<Bid[]> {
    return await db.select().from(bids).orderBy(desc(bids.createdAt));
  }

  async updateBidStatus(bidId: string, status: string, employeeId: string, notes?: string): Promise<Bid | undefined> {
    // Get current bid to track history
    const currentBid = await this.getBid(bidId);
    if (!currentBid) return undefined;

    // Update bid status
    const [updatedBid] = await db
      .update(bids)
      .set({
        status,
        notes: notes || currentBid.notes,
        updatedAt: new Date(),
      })
      .where(eq(bids.id, bidId))
      .returning();

    // Create history entry
    await this.createBidHistoryEntry({
      bidId,
      previousStatus: currentBid.status,
      newStatus: status,
      changedBy: employeeId,
      notes,
    });

    return updatedBid;
  }

  async approveBid(bidId: string, employeeId: string): Promise<Bid | undefined> {
    const currentBid = await this.getBid(bidId);
    if (!currentBid) return undefined;

    const [approvedBid] = await db
      .update(bids)
      .set({
        status: "approved",
        approvedBy: employeeId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bids.id, bidId))
      .returning();

    // Create history entry
    await this.createBidHistoryEntry({
      bidId,
      previousStatus: currentBid.status,
      newStatus: "approved",
      changedBy: employeeId,
      notes: "Bid approved by employee",
    });

    return approvedBid;
  }

  async rejectBid(bidId: string, employeeId: string, notes: string): Promise<Bid | undefined> {
    const currentBid = await this.getBid(bidId);
    if (!currentBid) return undefined;

    const [rejectedBid] = await db
      .update(bids)
      .set({
        status: "rejected",
        rejectedBy: employeeId,
        rejectedAt: new Date(),
        notes,
        updatedAt: new Date(),
      })
      .where(eq(bids.id, bidId))
      .returning();

    // Create history entry
    await this.createBidHistoryEntry({
      bidId,
      previousStatus: currentBid.status,
      newStatus: "rejected",
      changedBy: employeeId,
      notes,
    });

    return rejectedBid;
  }

  async updateBidPaymentInfo(bidId: string, paymentInfo: {
    stripePaymentIntentId?: string;
    stripeDepositRefundId?: string;
    stripeFeeRefundId?: string;
    isRefunded?: boolean;
  }): Promise<Bid | undefined> {
    const [updatedBid] = await db
      .update(bids)
      .set({
        ...paymentInfo,
        updatedAt: new Date(),
      })
      .where(eq(bids.id, bidId))
      .returning();
    return updatedBid;
  }

  async deleteBid(bidId: string): Promise<void> {
    await db.delete(bids).where(eq(bids.id, bidId));
  }

  // Bid history operations
  async createBidHistoryEntry(entry: Omit<BidHistory, "id" | "createdAt">): Promise<BidHistory> {
    const [historyEntry] = await db.insert(bidHistory).values(entry).returning();
    return historyEntry;
  }

  async getBidHistory(bidId: string): Promise<BidHistory[]> {
    return await db
      .select()
      .from(bidHistory)
      .where(eq(bidHistory.bidId, bidId))
      .orderBy(desc(bidHistory.createdAt));
  }

  // Employee action operations
  async createEmployeeAction(action: Omit<EmployeeAction, "id" | "createdAt">): Promise<EmployeeAction> {
    const [employeeAction] = await db.insert(employeeActions).values(action).returning();
    return employeeAction;
  }

  async getEmployeeActions(employeeId: string): Promise<EmployeeAction[]> {
    return await db
      .select()
      .from(employeeActions)
      .where(eq(employeeActions.employeeId, employeeId))
      .orderBy(desc(employeeActions.createdAt));
  }
}

export const storage = new DatabaseStorage();
