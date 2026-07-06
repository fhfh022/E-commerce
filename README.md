# 🛍️ PRT Store: Next-Gen AI-Powered E-Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Clerk](https://img.shields.io/badge/Clerk-Authentication-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-008CDD?style=for-the-badge&logo=stripe)](https://stripe.com/)

> **Elevate your shopping experience.** An ultra-fast, modern, and secure e-commerce solution integrating cutting-edge AI assistance, robust transaction handling, and comprehensive management portals.

🔗 **Live Demo:** [https://prt-main.vercel.app](https://prt-main.vercel.app)

---

## 📖 Overview

**PRT Store** is an enterprise-grade full-stack e-commerce solution engineered for speed, safety, and engagement. Powered by **Next.js 15**, **Tailwind CSS v4**, **Supabase**, and **PostgreSQL**, the platform delivers a fluid shopping interface paired with a sophisticated **AI Assistant** for smart searches and customer inquiries. 

Additionally, it provides isolated environments tailored for three distinct roles:
1. **Customers**: Browsing, interactive cart management, dynamic checkout, order tracking, and live AI assistant chat.
2. **Store Managers**: Product listings creation, real-time inventory configuration, and promotion control.
3. **System Administrators**: High-level platform governance including user access roles, orders auditing, coupon definitions, and blog management.

---

## ✨ Key Features

### 🛒 Customer Storefront
*   **Dynamic Product Discovery**: Browse products through optimized sorting, filtering, and deep categorization.
*   **Frictionless Shopping Cart & Favorites**: Add items, apply promotional discount coupons, and bookmark favorites instantly with persistent client state.
*   **Receipt & Invoice Printing**: Export invoices easily using custom print-ready formats.

### 🤖 AI Integration (Powered by Gemini API)
*   **AI-Powered Product Search (Semantic Search)**: Leverage natural language search using advanced AI embedding matching to find items based on concepts and descriptions rather than exact keywords.
*   **AI Assistant Chat (PRT Assistant)**: Get instant answers, product suggestions, and customer support via the integrated chat assistant.
*   **AI Specifications Auto-Fill**: Allow store managers to automatically extract and populate technical product specifications during item creation using AI analysis.
*   **AI Review Summarizer**: Automatically analyze and synthesize customer reviews on product pages into key pros, cons, and overall sentiment.
*   **Visual Search (Search by Image)**: Search the store catalog simply by uploading a photo of a laptop or hardware component. AI analyzes the image to perform the search.
*   **Smart Cart Upsell Assistant**: Analyze the items in the user's cart and suggest complementary products (Frequently Bought Together) or related items.

### 💳 Secure Payment Gateway
*   **Stripe Checkout**: Seamless payment routing supporting multiple payment modes (Credit Cards, PromptPay).
*   **Automated Webhooks**: Real-time order fulfillment, payment verification, and automatic inventory adjustment upon successful payment completion.

### 🏪 Store Manager Portal
*   **Product Management**: Comprehensive interface for adding, editing, and deleting items.
*   **Promotional Campaign Engine**: Set active promotions, discounts, and custom banners.

### 👨‍💼 Admin Dashboard
*   **Access Control & Roles**: Transition users between customer and manager roles securely.
*   **Order Supervision**: Track order updates, total revenue charts, and purchase histories system-wide.
*   **Marketing Tools**: Manage discount coupons, coupon validation rules, and publish informative blog content.

---

## 🛠️ Tech Stack

*   **Frontend**: Next.js 15 (App Router), React 19, TypeScript
*   **Styling**: Tailwind CSS v4, Lucide React (Icons)
*   **State Management**: Redux Toolkit, Redux Persist
*   **Database & API**: Supabase Client, Prisma Client, PostgreSQL
*   **Auth**: Clerk Security & Middleware
*   **Payments**: Stripe SDK & Stripe Webhooks
*   **AI**: `@google/generative-ai` (Gemini API)
*   **Analytics**: Recharts for performance metrics

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and configure the following variables:

| Variable Name | Description | Example / Format |
|---|---|---|
| `NEXT_PUBLIC_CURRENCY_SYMBOL` | Currency symbol used throughout the app | `฿` or `$` |
| `NEXT_PUBLIC_BASE_URL` | Application root URL | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API endpoint URL | `https://your-project-id.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client public anonymous key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase server-side service role secret key | `eyJhbGciOi...` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`| Clerk public credentials key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk private security credential | `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client-side token | `pk_test_...` |
| `STRIPE_SECRET_KEY` | Stripe server-side secret API token | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret key signature verification | `whsec_...` |
| `GEMINI_API_KEY` | Google Generative AI API Token | `AIzaSy...` |

---

## 📁 Project Structure

```
prt-main/
├── app/
│   ├── (public)/               # Customer Storefront (Shop, Cart, AI Search, Blogs, Chat)
│   ├── admin/                  # Admin Dashboard (User roles, Coupons, Store orders, Admin blogs)
│   ├── store/                  # Store Manager Portal (Inventory management, Product creation)
│   ├── api/                    # Server-side API endpoints & Stripe webhook listeners
│   ├── layout.jsx              # Global application wrapping layer
│   └── globals.css             # Main styling import layer
├── components/                 # Shared UI elements (Product cards, Cart items, Layout headers)
├── lib/                        # Configuration clients (Supabase setup, helper scripts)
└── package.json                # Project dependencies and script runner configurations
```

---

## 🚀 Getting Started & Installation

Follow these steps to run the development server locally:

1. **Clone the repository**:
    ```bash
    git clone https://github.com/PRTEZ/prt-main.git
    cd prt-main
    ```

2. **Install dependencies**:
    ```bash
    npm install
    ```

3. **Configure environment variables**:
    Duplicate the configuration and fill in the values:
    ```bash
    cp .env.example .env
    ```

4. **Run the development server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

5. **Build for production**:
    ```bash
    npm run build
    npm run start
    ```

---

## 📄 License & Credit

Developed and maintained by **PRTEZ** / **PRT Corporation**. All rights reserved. 
For internal use or licensed partnerships.
