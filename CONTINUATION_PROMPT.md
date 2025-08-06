# Loy Loyalty Program - Continuation Prompt

## 🎯 Context & Current Situation

You are working on the **Loy Loyalty Program** - a Next.js full-stack SaaS MVP for digital loyalty cards with Apple/Google Wallet integration. The project has been successfully migrated from vanilla JS to modern React + TypeScript + Tailwind CSS stack with simplified data structure.

## 📋 Project Rules & Standards

**Tech Stack:**
- Frontend: React 18 + TypeScript + Tailwind CSS + Vite
- Backend: Node.js + Express + TypeScript + MongoDB + Redis
- Validation: Zod (frontend) + Joi (backend)
- API Integration: React Query + Zustand
- Styling: Tailwind CSS, mobile-first iOS design

**Code Style:**
- TypeScript everywhere, strict mode, no `any` types
- Functional programming patterns, no classes
- Modules by feature: `/features/editor`, `/features/admin`, etc.
- Self-documenting names: `isLoading`, `hasError`, `printAreaBounds`
- Directory names in kebab-case, component files PascalCase
- KISS principle, max 50 lines per function
- Comprehensive error handling and logging

## 🚨 CRITICAL ISSUE TO RESOLVE FIRST

**Problem:** Registration fails with "Internal Server Error (500)"

**Root Cause:** MongoDB has old unique index `email_1` but new schema doesn't have `email` field. When creating customer with `null` email, MongoDB throws duplicate key error.

**Required Fix:**
```bash
# Connect to MongoDB and drop the old email index
mongosh loy_dev --eval "db.customers.dropIndex('email_1')"
```

**Error Details:**
```
E11000 duplicate key error collection: loy_dev.customers index: email_1 dup key: { email: null }
```

## 📊 Current Data Schema (Simplified)

**Customer Registration (NEW):**
```typescript
// Frontend Form Data
interface RegistrationFormData {
  name: string;        // "Иван Петров" (combined first + last name)
  phone: string;       // "+7 (999) 123-45-67"
}

// Backend Customer Model
interface Customer {
  id: string;
  name: string;        // Combined first + last name
  phone: string;       // Russian phone format
  cardNumber: string;  // Auto-generated
  balance: number;     // Default: 0
  isActive: boolean;   // Default: true
  createdAt: Date;
}
```

**Removed Fields:** `email`, `firstName`, `lastName`

## 🏗️ Architecture Status

### ✅ Completed Components

**Frontend (React + TypeScript):**
- ✅ RegistrationForm.tsx - Simplified 2-field form
- ✅ WalletSelection.tsx - Device detection + wallet buttons
- ✅ DownloadScreen.tsx - QR code + retry options
- ✅ SuccessScreen.tsx - Completion flow
- ✅ API integration with React Query
- ✅ Phone formatting and validation
- ✅ Mobile-first responsive design

**Backend (Node.js + Express):**
- ✅ Customer model updated (name field only)
- ✅ All controllers updated (28 TypeScript errors fixed)
- ✅ Joi validation schemas updated
- ✅ API endpoints working (tested via curl)
- ✅ Duplicate phone validation working

### 🧪 Testing Status

**Backend API (✅ Working):**
```bash
# Success Test
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{"name": "Иван Петров", "phone": "+7 (999) 123-45-67"}'
# Returns: 201 Created

# Duplicate Test  
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{"name": "Петр Сидоров", "phone": "+7 (999) 123-45-67"}'
# Returns: 409 Conflict - "Customer with this phone already exists"
```

**Frontend Integration (❌ Blocked):**
- Form validation works correctly
- Phone formatting works correctly
- Registration fails due to MongoDB index issue

## 🚀 Immediate Tasks

### 1. Fix MongoDB Index (CRITICAL)
```bash
# Required command to run:
mongosh loy_dev --eval "db.customers.dropIndex('email_1')"
```

### 2. Test Full Integration
- Start backend: `npm run dev` (port 3000)
- Start frontend: `cd frontend && npm run dev` (port 3002)
- Open `http://localhost:3002`
- Test registration with new phone number
- Test duplicate phone validation
- Test Apple/Google Wallet flow

### 3. Verify End-to-End Flow
- Registration form submission
- Device detection (iOS/Android/other)
- Wallet card generation
- QR code fallback
- Success confirmation

## 📁 Project Structure

```
/Users/zakhar/Desktop/loy/
├── README_CURRENT_STATUS.md     # Detailed project status
├── frontend/                    # React app (port 3002)
│   ├── src/
│   │   ├── components/screens/  # Main screens
│   │   ├── lib/api.ts          # API client (real backend only)
│   │   ├── types/index.ts      # Updated interfaces
│   │   └── hooks/              # React Query hooks
├── src/                        # Backend (port 3000)
│   ├── models/customer.ts      # Updated schema
│   ├── controllers/            # Updated controllers
│   ├── services/              # Updated services
│   └── utils/validation.ts    # Updated Joi schemas
└── logs/app.log               # Backend logs
```

## 🎯 Success Criteria

After fixing the MongoDB index issue, you should achieve:

1. **✅ Successful Registration:**
   - Form accepts "Имя и фамилия" + "Телефон"
   - Returns customer with auto-generated cardNumber
   - No TypeScript or validation errors

2. **✅ Duplicate Prevention:**
   - Same phone number returns 409 error
   - Clear error message in UI

3. **✅ Wallet Integration:**
   - Device detection works
   - Apple/Google Wallet buttons appear correctly
   - QR code fallback available

## 🔧 Development Commands

```bash
# Backend
npm run dev                    # Start backend server (port 3000)
npx tsc --noEmit              # Check TypeScript errors
tail -f logs/app.log          # Monitor backend logs

# Frontend  
cd frontend
npm run dev                   # Start React dev server (port 3002)
npm run build                 # Build for production

# Database
mongosh loy_dev               # Connect to MongoDB
db.customers.find()           # View customers
db.customers.dropIndex('email_1')  # Fix the index issue
```

## 🎨 Design System

- **Colors:** iOS palette (Blue #007AFF, Green #34C759, Gray #8E8E93)
- **Typography:** SF Pro Display font stack
- **Components:** iOS-style inputs, buttons, navigation
- **Layout:** Mobile-first, clean minimal design
- **Interactions:** Native iOS animations and transitions

---

**Your Task:** Fix the MongoDB index issue and complete the end-to-end testing of the simplified registration flow. The project is 95% complete and just needs this final database cleanup to be fully functional.
