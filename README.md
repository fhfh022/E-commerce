# GoCart - E-commerce Platform

A modern, full-featured e-commerce application built with Next.js, featuring user authentication, product management, shopping cart, and admin/store dashboards.

## 🚀 Features

- **User Authentication**: Secure login/signup with Clerk
- **Product Management**: Browse, search, and filter products
- **Shopping Cart**: Add, remove, and manage cart items
- **Order Management**: Place orders, track status, and view order history
- **Store Management**: Sellers can manage their products and orders
- **Admin Dashboard**: Comprehensive admin panel for platform management
- **Responsive Design**: Mobile-first design with modern UI
- **Real-time Updates**: Live cart and product updates

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Authentication**: Clerk
- **Database**: Supabase
- **State Management**: Redux Toolkit
- **Payment**: Stripe
- **Icons**: Lucide React
- **Charts**: Recharts
- **Deployment**: Ready for Vercel/Netlify

## 📁 Project Structure

```
gocart-main/
├── app/                          # Next.js app router pages
│   ├── (public)/                 # Public pages
│   │   ├── cart/                 # Shopping cart
│   │   ├── favorites/            # User favorites
│   │   ├── orders/               # Order history
│   │   ├── product/[productId]/  # Product details
│   │   ├── shop/                 # Product listing
│   │   └── page.jsx              # Homepage
│   ├── admin/                    # Admin dashboard
│   ├── store/                    # Store management
│   ├── layout.jsx                # Root layout
│   └── page.jsx                  # Home redirect
├── components/                   # React components
│   ├── layout/                   # Layout components
│   │   ├── admin/                # Admin UI components
│   │   ├── store/                # Store UI components
│   │   └── [Banner, Footer, etc.]
│   ├── product/                  # Product-related components
│   │   └── [ProductCard, etc.]
│   └── providers/                # Context providers
├── lib/                          # Utilities and configurations
│   ├── features/                 # Redux slices
│   ├── store.js                  # Redux store
│   ├── supabase.ts               # Database client
│   └── stripe.js                 # Stripe configuration
├── assets/                       # Static assets
├── middleware.ts                 # Next.js middleware
├── postcss.config.mjs            # PostCSS configuration
└── package.json                  # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Clerk account
- Stripe account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/fhfh022/E-commerce.git
cd gocart-main
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
NEXT_PUBLIC_CURRENCY_SYMBOL=$
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint




