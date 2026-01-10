# PRT Store - แพลตฟอร์มอีคอมเมิร์ซสมัยใหม่

แพลตฟอร์มอีคอมเมิร์ซที่สมบูรณ์แบบ สร้างด้วย Next.js พร้อมฟีเจอร์การยืนยันตัวตนผู้ใช้ การจัดการสินค้า ตะกร้าสินค้า และแดชบอร์ดสำหรับผู้ดูแลระบบและร้านค้า

## ✨ ฟีเจอร์หลัก

### 👤 ผู้ใช้ทั่วไป
- **การยืนยันตัวตน**: เข้าสู่ระบบ/สมัครสมาชิกอย่างปลอดภัยด้วย Clerk
- **เรียกดูสินค้า**: ค้นหา กรอง และดูรายละเอียดสินค้า
- **ตะกร้าสินค้า**: เพิ่ม ลบ และจัดการสินค้าในตะกร้า
- **การสั่งซื้อ**: วางคำสั่งซื้อ ติดตามสถานะ และดูประวัติการสั่งซื้อ
- **ใบเสร็จ**: พิมพ์และบันทึกใบเสร็จการสั่งซื้อ
- **สินค้าที่ชอบ**: บันทึกและจัดการสินค้าที่ชื่นชอบ
- **รีวิวสินค้า**: ให้คะแนนและแสดงความคิดเห็นสินค้า

### 🏪 ผู้ขาย/ร้านค้า
- **จัดการสินค้า**: เพิ่ม แก้ไข และลบสินค้า
- **จัดการคำสั่งซื้อ**: ติดตามและอัปเดตสถานะคำสั่งซื้อ
- **แดชบอร์ด**: ดูสถิติยอดขายและสินค้า

### 👨‍💼 ผู้ดูแลระบบ
- **จัดการผู้ใช้**: ดู จัดการ และบล็อกผู้ใช้
- **จัดการคูปอง**: สร้างและจัดการคูปองส่วนลด
- **แดชบอร์ดครบครัน**: จัดการแพลตฟอร์มทั้งหมด

### 🤖 AI Assistant
- **ผู้ช่วยอัจฉริยะ**: ช่วยเหลือในการเลือกสินค้าและคำถามทั่วไป

### 🌐 การรองรับภาษา
- **อินเทอร์เฟซภาษาไทย**: แปลข้อความ UI เป็นภาษาไทยสำหรับผู้ใช้ไทย
- **รักษาคำศัพท์เทคนิค**: เก็บคำเฉพาะทางเทคนิคเป็นภาษาอังกฤษ

## 🛠 เทคโนโลยีที่ใช้

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **State Management**: Redux Toolkit + Redux Persist
- **Payment Processing**: Stripe (รองรับบัตรเครดิตและ PromptPay)
- **AI Integration**: Google Generative AI
- **Icons**: Lucide React
- **Charts**: Recharts
- **Printing**: React-to-Print สำหรับใบเสร็จ
- **Deployment**: พร้อมใช้งานกับ Vercel/Netlify

## 📁 Project Structure

```
prt-main/
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




