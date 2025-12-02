# West Automotive Auction Bidding Platform

## Project Overview
Multi-tier auction bidding platform with three authentication levels:
- **Customers**: Submit bids with ID verification, pay service fees + deposits
- **Employees**: Manage bids on behalf of customers, update bid statuses
- **Super Admins**: Manage employee accounts, full system oversight

## Current Implementation Status

### ✅ Completed
1. **Database Schema** (`shared/schema.ts`)
   - Users table with role-based access (customer/employee/super_admin)
   - Bids table with payment tracking and status management
   - Documents table for ID/address verification
   - Audit logs for tracking all actions

2. **Authentication System** (`server/replitAuth.ts`)
   - Replit Auth integration (supports Google, GitHub, email/password)
   - Three-tier middleware: `requireCustomer`, `requireEmployee`, `requireSuperAdmin`
   - Session management with PostgreSQL storage
   - Auto-upsert users on first login

3. **Storage Layer** (`server/storage.ts`)
   - Complete CRUD operations for users, bids, documents
   - PostgreSQL with Drizzle ORM
   - Type-safe database queries

4. **API Endpoints** (`server/routes.ts`)
   - `/api/auth/user` - Get current user
   - `/api/onboarding/complete` - Complete user profile (customer/employee)
   - `/api/customer/bids` - Customer bid management
   - `/api/employee/bids` - Employee bid oversight
   - `/api/employee/bids/:id/status` - Update bid status
   - `/api/admin/employees` - Super admin employee management

5. **Frontend Components**
   - Landing page with West Automotive branding
   - Onboarding flow for role selection and verification
   - Customer dashboard with bid submission
   - Employee dashboard for bid management
   - Super admin dashboard for employee oversight

6. **Design System** (`client/src/index.css`, `tailwind.config.ts`)
   - Slate-900 navigation (#0F172A)
   - Blue gradient branding (#1E40AF to #3B82F6)
   - Inter typography
   - Responsive shadcn components

### 🚧 In Progress
1. **Stripe Payment Integration**
   - Payment intent creation for service fee + deposit
   - Refund processing for outbid/lost bids
   - Environment variable management for API keys

2. **Document Upload System**
   - Multer configuration for ID/address documents
   - File storage in `/uploads` directory
   - Document verification workflow

3. **End-to-End Testing**
   - Complete user journey testing
   - Payment flow validation
   - Role-based access testing

## User Workflows

### Customer Journey
1. Sign in with Replit Auth (Google/GitHub/Email)
2. Complete onboarding: Upload ID + address documents
3. Submit bid with lot number and max bid amount
4. Pay $215 service fee + 10% deposit via Stripe
5. Wait for employee to process bid
6. Receive refund if outbid, keep deposit if won

### Employee Journey
1. Sign in with Replit Auth
2. Enter company code during onboarding (default: `WEST2024`)
3. View all pending customer bids
4. Approve and bid on customer's behalf
5. Update bid status (pending → winning → won/lost)
6. Process refunds for losing bids

### Super Admin Journey
1. Sign in with Replit Auth (manually set userType to super_admin in database)
2. View all employees
3. Manage employee accounts (activate/deactivate)
4. Audit all system actions

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `REPL_ID` - Replit project ID (auto-set)
- `ISSUER_URL` - OIDC issuer URL (defaults to replit.com/oidc)

### Optional (Stripe Integration)
- `STRIPE_SECRET_KEY` - Stripe secret key for payments
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key for frontend
- `COMPANY_CODE` - Employee registration code (defaults to WEST2024)

## Technical Stack
- **Frontend**: React + TypeScript + Wouter + TanStack Query + shadcn/ui
- **Backend**: Express + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Replit Auth (OIDC)
- **Payments**: Stripe
- **Styling**: Tailwind CSS + West Automotive design tokens

## Key Files
- `shared/schema.ts` - Database schema and types
- `server/storage.ts` - Data access layer
- `server/routes.ts` - API endpoints
- `server/replitAuth.ts` - Authentication middleware
- `server/stripeService.ts` - Payment processing
- `client/src/App.tsx` - Main app with routing
- `client/src/pages/onboarding.tsx` - User role selection
- `client/src/pages/customer-home.tsx` - Customer dashboard
- `client/src/pages/employee-dashboard.tsx` - Employee dashboard
- `client/src/pages/super-admin-dashboard.tsx` - Admin dashboard

## Development Notes

### Creating Super Admin User
Since there's no UI to promote users to super admin, you need to manually update the database:
```sql
UPDATE users SET user_type = 'super_admin', is_verified = true WHERE email = 'your-email@example.com';
```

### Company Code
Default company code for employee registration: `WEST2024`
Can be overridden with `COMPANY_CODE` environment variable

### Document Upload
Customer ID and address documents are stored in `/uploads` directory
Filenames are automatically generated with timestamps for uniqueness

### Bid Status Flow
- `pending` - Customer submitted, awaiting employee approval
- `winning` - Employee approved, currently winning
- `outbid` - Another bid exceeded this one
- `won` - Auction ended, this bid won
- `lost` - Auction ended, this bid lost

### Payment Flow
1. Customer creates bid (service fee + deposit calculated automatically)
2. Payment intent created via `/api/customer/bids/:bidId/create-payment-intent`
3. Customer completes payment via Stripe
4. If outbid or lost, refund processed via `/api/employee/bids/:bidId/refund`

## Next Steps
1. Complete Stripe integration with live payment flow
2. Add document verification workflow for admins
3. Implement audit logging for all actions
4. Add comprehensive e2e tests
5. Deploy to production

## Design Guidelines
See `design_guidelines.md` for detailed West Automotive design specifications including:
- Color palette (slate-900 primary, blue accent)
- Typography (Inter font family)
- Component styling (rounded corners, elevation, hover states)
- Responsive breakpoints
