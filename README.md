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
- **Styling**: Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase
- **State Management**: Redux Toolkit
- **Icons**: Lucide React
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
│   └── supabase.ts               # Database client
├── assets/                       # Static assets
├── middleware.ts                 # Next.js middleware
├── tailwind.config.js            # Tailwind configuration
└── package.json                  # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Clerk account

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

## 🎯 Key Components

### Components Organization
- **providers/**: Authentication and app initialization
- **layout/**: UI layout components (Navbar, Footer, etc.)
- **product/**: Product display and management components

### Main Features
- **Public Pages**: Homepage, product browsing, cart, checkout
- **User Dashboard**: Order history, favorites, profile
- **Store Dashboard**: Product management, order fulfillment
- **Admin Dashboard**: Platform analytics, user management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 📞 Contact

For questions or support, please open an issue on GitHub.
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/(public)/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Outfit](https://vercel.com/font), a new font family for Vercel.

---

## 🤝 Contributing <a name="-contributing"></a>

We welcome contributions! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) for more details on how to get started.

---

## 📜 License <a name="-license"></a>

This project is licensed under the MIT License. See the [LICENSE.md](./LICENSE.md) file for details.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
