# PRT Store - E-Commerce Platform

แพลตฟอร์ม e-commerce ที่มีสมบูรณ์พร้อมระบบ Admin Panel, Seller Dashboard, Payment Gateway Integration และระบบบริหารสต็อกอัตโนมัติ

## 🎯 ฟีเจอร์หลัก

### 🛍️ Customer Portal
- ระบบค้นหาและ Filter สินค้า พร้อม Shopping Cart
- Process การสั่งซื้อ (Checkout) ด้วย Stripe Integration
- Order Tracking และ Receipt Management (Print-Ready)
- ระบบ Review & Rating สินค้า
- Wish List Management
- AI-Powered Shopping Assistant (Google Generative AI)
- Coupon Application

### 🏪 Seller Dashboard
- CRUD สินค้า (Create, Read, Update, Delete) พร้อม Inventory Management
- Order Management และ Status Update
- Sales Analytics Dashboard พร้อม Chart Visualization
- Promotion Management

### 👨‍💼 Admin Panel
- User Management (Role-Based Access Control)
- Coupon Management และ Usage Tracking
- System-Wide Order Monitoring
- Revenue Analytics และ Business Intelligence

## 🔧 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | Next.js 15 + React 19 + TypeScript |
| **UI Framework** | Tailwind CSS v4 |
| **State Management** | Redux Toolkit + Redux Persist |
| **Backend** | Next.js API Routes + Webhook Handler |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Clerk (OAuth Integration) |
| **Payment Gateway** | Stripe API (Card, PromptPay) |
| **AI Integration** | Google Generative AI API |
| **Visualization** | Recharts (Data Analytics) |
| **Icons & UI** | Lucide React |
| **Utilities** | React-to-Print (Document Export) |

## ✨ Key Features

✅ **Automatic Inventory Management**: ระบบอัตโนมัติตัดสต็อก เมื่อ Payment สำเร็จ  
✅ **Coupon System**: Validation, Usage Tracking และ Expiry Management  
✅ **Stripe Webhook Integration**: Real-time Order Status Update เมื่อ Payment Completed  
✅ **Advanced Search & Filtering**: Category, Price Range และ Sorting  
✅ **Real-time Order Tracking**: Live Status Updates  
✅ **Invoice Generation**: Export Receipt เป็น PDF

## 🚀 Installation & Setup

```bash
# Clone repository
git clone <repository-url>
cd prt-main

# Install dependencies
npm install

# Configure Environment Variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=<supabase_url>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<clerk_pk>
CLERK_SECRET_KEY=<clerk_sk>
STRIPE_PUBLIC_KEY=<stripe_pk>
STRIPE_SECRET_KEY=<stripe_sk>
STRIPE_WEBHOOK_SECRET=<webhook_secret>
NEXT_PUBLIC_BASE_URL=<app_url>

# Start Development Server
npm run dev

# Production Build
npm run build
npm start
```

## 📊 Database Schema

**Core Tables**: 
- `users` - User Account Management
- `products` - Product Catalog & Inventory
- `orders` - Order Headers
- `order_items` - Order Line Items
- `coupons` - Discount Codes Management
- `cart` - Shopping Cart (Session-based)
- `favorites` - Wish List
- `ratings` - Product Reviews & Ratings
- `blogs` - Content Management

## 📁 Project Structure

```
prt-main/
├── app/
│   ├── api/                    # API Routes (Checkout, Webhook)
│   ├── (public)/               # Customer-facing Pages
│   ├── admin/                  # Admin Dashboard
│   └── store/                  # Seller Dashboard
├── components/                 # Reusable React Components
├── lib/
│   ├── supabase.ts            # Database Configuration
│   ├── stripe.js              # Stripe Setup
│   └── features/              # Redux Slices
├── public/                     # Static Assets
└── middleware.ts               # Authentication Middleware
```
├── app/                          # Next.js App Router
│   ├── (public)/                 # หน้าเว็บสาธารณะ
│   │   ├── cart/                 # ตะกร้าสินค้า
│   │   ├── favorites/            # สินค้าที่ชอบ
│   │   ├── orders/               # ประวัติการสั่งซื้อ
│   │   ├── product/[productId]/  # รายละเอียดสินค้า
│   │   ├── shop/                 # รายการสินค้า
│   │   ├── promotions/           # โปรโมชั่น
│   │   └── page.jsx              # หน้าแรก
│   ├── admin/                    # แดชบอร์ดผู้ดูแลระบบ
│   │   ├── coupons/              # จัดการคูปอง
│   │   ├── orders/               # จัดการคำสั่งซื้อ
│   │   └── users/                # จัดการผู้ใช้
│   ├── store/                    # แดชบอร์ดร้านค้า
│   │   ├── add-product/          # เพิ่มสินค้า
│   │   ├── manage-product/       # จัดการสินค้า
│   │   └── manage-promotions/    # จัดการโปรโมชั่น
│   ├── api/                      # API Routes
│   │   ├── ai-assistant/         # AI ผู้ช่วย
│   │   ├── checkout/             # การชำระเงิน
│   │   ├── stripe/               # Stripe webhooks
│   │   └── update-user-role/     # อัปเดตสิทธิ์ผู้ใช้
│   ├── globals.css               # สไตล์หลัก
│   ├── layout.jsx                # เลย์เอาต์หลัก
│   └── loading.jsx               # หน้าโหลด
├── components/                   # คอมโพเนนต์ React
│   ├── layout/                   # คอมโพเนนต์เลย์เอาต์
│   │   ├── admin/                # UI ผู้ดูแลระบบ
│   │   ├── store/                # UI ร้านค้า
│   │   └── [Banner, Footer, etc.]
│   ├── product/                  # คอมโพเนนต์สินค้า
│   │   └── [ProductCard, OrderItem, etc.]
│   ├── order/                    # คอมโพเนนต์คำสั่งซื้อ
│   │   └── ReceiptModal.jsx      # ใบเสร็จ
│   └── providers/                # Context Providers
├── lib/                          # ยูทิลิตี้และการตั้งค่า
│   ├── features/                 # Redux Slices
│   │   ├── address/              # ที่อยู่จัดส่ง
│   │   ├── auth/                 # การยืนยันตัวตน
│   │   ├── cart/                 # ตะกร้าสินค้า
│   │   └── product/              # สินค้า
│   ├── store.js                  # Redux Store
│   ├── supabase.ts               # Supabase Client
│   ├── stripe.js                 # Stripe Config
│   └── cookies.js                # จัดการคุกกี้
├── assets/                       # ไฟล์สแตติก
├── middleware.ts                 # Middleware การยืนยันตัวตน
├── next.config.mjs               # การตั้งค่า Next.js
├── postcss.config.mjs            # PostCSS Config
├── tailwind.config.js            # Tailwind Config
├── package.json                  # Dependencies
└── README.md                     # เอกสารนี้
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Clerk account
- Stripe account

### Installation

To get started with the PRT e-commerce platform, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/prt-main.git
   cd prt-main
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your configuration settings.
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000` to see the application in action.

## 📄 Usage

Once the application is running, you can:

- Register a new account or log in with an existing account.
- Browse products, add them to your cart, and place orders.
- Access the admin dashboard to manage products and orders.


## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint




