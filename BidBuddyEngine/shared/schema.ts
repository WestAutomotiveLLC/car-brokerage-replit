import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  decimal
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User types: customer, employee, super_admin
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userType: varchar("user_type", { length: 20 }).notNull().default("customer"), // customer, employee, super_admin
  isActive: boolean("is_active").default(true).notNull(),
  companyCode: varchar("company_code", { length: 50 }), // For employee verification
  idDocumentUrl: varchar("id_document_url"), // Customer ID verification
  addressDocumentUrl: varchar("address_document_url"), // Customer address verification
  isVerified: boolean("is_verified").default(false).notNull(), // Document verification status
  stripeCustomerId: varchar("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bids table
export const bids = pgTable("bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  lotNumber: varchar("lot_number", { length: 100 }).notNull(),
  maxBidAmount: decimal("max_bid_amount", { precision: 10, scale: 2 }).notNull(),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).notNull().default("215.00"),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }).notNull(), // 10% of max bid
  totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).notNull(), // serviceFee + depositAmount
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected, winning, outbid, won, lost
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeDepositRefundId: varchar("stripe_deposit_refund_id"),
  stripeFeeRefundId: varchar("stripe_fee_refund_id"),
  isRefunded: boolean("is_refunded").default(false).notNull(),
  approvedBy: varchar("approved_by").references(() => users.id), // Employee who approved
  approvedAt: timestamp("approved_at"),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  notes: text("notes"), // Employee notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bid status history for audit trail
export const bidHistory = pgTable("bid_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bidId: varchar("bid_id").notNull().references(() => bids.id, { onDelete: "cascade" }),
  previousStatus: varchar("previous_status", { length: 20 }),
  newStatus: varchar("new_status", { length: 20 }).notNull(),
  changedBy: varchar("changed_by").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Employee management log (for super admin)
export const employeeActions = pgTable("employee_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => users.id),
  actionType: varchar("action_type", { length: 50 }).notNull(), // created, deleted, activated, deactivated
  performedBy: varchar("performed_by").notNull().references(() => users.id), // Super admin
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const upsertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedBy: true,
  approvedAt: true,
  rejectedBy: true,
  rejectedAt: true,
  stripePaymentIntentId: true,
  stripeDepositRefundId: true,
  stripeFeeRefundId: true,
  isRefunded: true,
}).extend({
  lotNumber: z.string().min(1, "Lot number is required"),
  maxBidAmount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Max bid amount must be a positive number",
  }),
});

export const updateBidStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "winning", "outbid", "won", "lost"]),
  notes: z.string().optional(),
});

export const createEmployeeSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyCode: z.string().min(1),
});

// Type exports
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Bid = typeof bids.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type UpdateBidStatus = z.infer<typeof updateBidStatusSchema>;
export type BidHistory = typeof bidHistory.$inferSelect;
export type EmployeeAction = typeof employeeActions.$inferSelect;
export type CreateEmployee = z.infer<typeof createEmployeeSchema>;
