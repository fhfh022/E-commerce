# 📚 เอกสารอธิบายโครงสร้างและการทำงานของซอร์สโค้ด (PRT E-Commerce Project)

คู่มือฉบับนี้จัดทำขึ้นเพื่ออธิบายสถาปัตยกรรม โครงสร้างระบบ และฟังก์ชันการทำงานของโค้ดในแต่ละหน้า/คอมโพเนนต์หลักของโปรเจกต์ **PRT Store (E-Commerce)**

---

## 🛠️ 1. เทคโนโลยีหลักที่ใช้ในโปรเจกต์ (Tech Stack)

- **Frontend Framework**: [Next.js 15 (App Router)](https://nextjs.org/) ด้วย React 19
- **Styling**: Vanilla CSS + Tailwind CSS v4
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) + `redux-persist`
- **Database & Storage**: [Supabase PostgreSQL](https://supabase.com/) & Supabase Storage
- **Authentication**: [Clerk Authentication](https://clerk.com/) + Supabase Sync
- **Artificial Intelligence**: [Google Gemini AI API](https://ai.google.dev/) (Gemini 1.5/2.0 + Vector Embeddings Search)
- **Payment Gateway**: [Stripe API](https://stripe.com/) (Credit/Debit Card Checkout & Webhook)
- **UI Components & Utilities**: `lucide-react`, `react-hot-toast`, `recharts`, `date-fns`

---

## 📁 2. โครงสร้างไดเรกทอรีหลัก (Directory Structure)

```text
prt-main/
├── app/                        # Next.js App Router Pages & API Routes
│   ├── (public)/               # หน้าหลักสำหรับผู้ใช้งานทั่วไป (Layout แบบ Public)
│   ├── admin/                  # หน้าผู้ดูแลระบบ (Admin Management Dashboard)
│   ├── store/                  # หน้าผู้ขาย (Seller / Store Management)
│   ├── api/                    # API Endpoints (Backend Serverless Functions)
│   ├── globals.css             # Global Tailwind & Design System Styles
│   └── layout.jsx              # Root Layout หลักของแอปพลิเคชัน
├── components/                 # React Components ที่แบ่งแยกตามหมวดหมู่
│   ├── layout/                 # Navigation, Footer, Hero, Banner, Newsletter
│   ├── product/                # ProductCard, AddressModal, OrderSummary, CouponPopup ฯลฯ
│   ├── order/                  # OrderItem, ReceiptModal, Status Badges
│   ├── blog/                   # BlogCard, BlogDetail
│   └── chat/                   # Live Chat Components
├── lib/                        # Helpers, Redux Store, Datasets & Utilities
│   ├── features/               # Redux Slices (cart, address, auth, favorite, user)
│   ├── data/                   # thaiLocations.js (ฐานข้อมูล 77 จังหวัดไทย)
│   ├── embeddings.js           # Google Gemini Vector Embedding Helper
│   ├── supabase.ts             # Supabase Client Configuration
│   └── store.js                # Redux Store Config
├── next.config.mjs             # การตั้งค่า Next.js (Remote Image Patterns ฯลฯ)
└── package.json                # Project Dependencies & Scripts
```

---

## 📄 3. รายละเอียดการทำงานในแต่ละหน้า (Page by Page Explanation)

### 3.1 หน้าผู้ใช้งานทั่วไป (`app/(public)/`)

#### 1. หน้าแรก (Home Landing Page) — `app/(public)/page.jsx` & `HomeContent.jsx`
- **หน้าที่**: หน้าแรกของเว็บไซต์ที่รวมองค์ประกอบหลักไว้ทั้งหมด
- **องค์ประกอบสำคัญ**:
  - `Banner.jsx`: แสดงแบนเนอร์โปรโมชั่นคูปองต้อนรับ (`WELCOME`) ด้านบนสุด
  - `Hero.jsx`: ส่วนแสดงแบนเนอร์สไลด์สินค้าไฮไลต์พร้อมปุ่มสั่งซื้อ
  - `CategoriesMarquee.jsx`: แถบหมวดหมู่สินค้าเคลื่อนไหว
  - `LatestProducts.jsx` & `BestSelling.jsx`: แสดงรายการสินค้ามาใหม่และสินค้าขายดี
  - `OurSpec.jsx`: ไฮไลต์จุดเด่นการบริการ (จัดส่งฟรี, รับประกันสินค้า, บริการ 24 ชม.)
  - `Newsletter.jsx`: ฟอร์มสมัครรับข่าวสารและคูปองส่วนลด

#### 2. หน้าคลังสินค้าทั้งหมด (Shop Page) — `app/(public)/shop/page.jsx`
- **หน้าที่**: แสดงรายการสินค้าทั้งหมดในร้านค้า
- **การทำงาน**:
  - ดึงข้อมูลสินค้าจาก Supabase Table `products`
  - มีระบบกรองสินค้าตามแบรนด์, ช่วงราคา, และหมวดหมู่
  - รองรับการค้นหาตามชื่อรุ่น หรือคำค้นหา (Search Keyword)

#### 3. หน้ารายละเอียดสินค้า (Product Details) — `app/(public)/product/[productId]/page.jsx`
- **หน้าที่**: แสดงข้อมูลเชิงลึกของสินค้าแต่ละรายการ
- **การทำงาน**:
  - `ProductSlider.jsx`: แสดงรูปภาพสินค้าหลักและรูปตัวอย่าง
  - `ProductDetails.jsx`: แสดงชื่อรุ่น, สเปก (CPU, RAM, GPU, Display), สต็อกสินค้า, ปุ่มเพิ่มลงตะกร้า และกดสินค้าโปรด (Wishlist)
  - `ProductDescription.jsx`: แสดงรายละเอียดคำอธิบายสินค้าฉบับเต็ม
  - **ระบบรีวิว**: แสดงคะแนนดาวรวมและรีวิวจากผู้ซื้อจริง พร้อมปุ่มเขียนรีวิว

#### 4. หน้าตะกร้าสินค้า (Shopping Cart) — `app/(public)/cart/page.jsx` & `CartContent.jsx`
- **หน้าที่**: จัดการสินค้าที่เลือกซื้อและการคำนวณราคารวม
- **การทำงาน**:
  - แสดงรายการสินค้าในตะกร้าจาก Redux Store (`cartSlice`)
  - ปรับเพิ่ม/ลดจำนวนสินค้า หรือลบสินค้าออกจากตะกร้า
  - `OrderSummary.jsx`: คำนวณราคารวม, เลือกที่อยู่จัดส่ง (`AddressModal`), ใส่รหัสคูปองส่วนลด, เลือกวิธีการชำระเงิน (Stripe)
  - **AI Recommendations Section**: ระบบ AI วิเคราะห์สินค้าในตะกร้าและแนะนำสินค้าที่มักซื้อร่วมกัน (Frequently Bought Together)

#### 5. หน้าแชทอัจฉริยะ (PRT Assistant AI Search) — `app/(public)/ai-search/page.jsx` & `AISearchContent.jsx`
- **หน้าที่**: ผู้ช่วย AI แนะนำการเลือกซื้อโน้ตบุ๊กตามงบประมาณและสเปก
- **การทำงาน**:
  - สื่อสารกับ `/api/ai-assistant` เพื่อตอบคำถามภาษาไทยด้วย **Google Gemini AI**
  - ค้นหาสินค้าที่ตรงตามสเปกด้วย **Vector Similarity Search (RAG)**
  - บันทึกประวัติการแชทลงตาราง `ai_chat_messages` ใน Supabase
  - มีปุ่ม **"ล้างประวัติ"** เพื่อลบประวัติแชทและเคลียร์สินค้าแนะนำ

#### 6. หน้าประวัติคำสั่งซื้อ (Orders History) — `app/(public)/orders/page.jsx`
- **หน้าที่**: แสดงรายการสั่งซื้อย้อนหลังของผู้ใช้
- **การทำงาน**:
  - `OrderItem.jsx`: แสดงสถานะการจัดส่ง (กำลังเตรียมสินค้า, จัดส่งแล้ว, สำเร็จ)
  - `ReceiptModal.jsx`: เปิดดูใบเสร็จรับเงินฉบับเต็ม
  - `RatingModal.jsx`: ให้คะแนนดาวและรีวิวสินค้าหลังจากได้รับสินค้าแล้ว

---

### 3.2 หน้าผู้ดูแลระบบ (`app/admin/`)

#### 1. แดชบอร์ดรวมภาพระบบ (Admin Dashboard) — `app/admin/page.jsx`
- **หน้าที่**: สรุปตัวเลขสถิติยอดขาย ออเดอร์ และผู้ใช้งาน
- **การทำงาน**:
  - แสดงยอดขายรวม (Total Revenue), จำนวนคำสั่งซื้อ, จำนวนสมาชิก
  - แสดงกราฟแนวโน้มยอดขาย (`OrdersAreaChart.jsx`)

#### 2. จัดการคำสั่งซื้อ (Manage Orders) — `app/admin/orders/page.jsx`
- **หน้าที่**: ตรวจสอบและอัปเดตสถานะออเดอร์ของลูกค้า
- **การทำงาน**: อัปเดตสถานะออเดอร์จาก "รอชำระเงิน" -> "ชำระแล้ว" -> "จัดส่งเรียบร้อย"

#### 3. จัดการคูปอง (Manage Coupons) — `app/admin/coupons/page.jsx`
- **หน้าที่**: เพิ่ม ลบ หรือกำหนดวันหมดอายุของคูปองส่วนลด (`coupons` table)

#### 4. จัดการผู้ใช้งาน (Manage Users) — `app/admin/users/page.jsx`
- **หน้าที่**: ตรวจสอบรายชื่อผู้ใช้ และกำหนดสิทธิ์ (User / Admin / Seller)

---

### 3.3 หน้าผู้ขายสินค้า (`app/store/`)

#### 1. หน้าเพิ่มสินค้าใหม่ (Add Product) — `app/store/add-product/page.jsx`
- **หน้าที่**: ฟอร์มกรอกข้อมูลสินค้าเพื่อลงขายในระบบ
- **ฟีเจอร์เด่น**:
  - อัปโหลดรูปภาพเข้า Supabase Storage
  - ปุ่ม **"AI Generate Description"** เรียกใช้ `/api/store/generate-desc` เพื่อให้ Gemini เขียนรายละเอียดสินค้าตามสเปกให้อัตโนมัติ

#### 2. หน้าจัดการสินค้า (Manage Products) — `app/store/manage-product/page.jsx`
- **หน้าที่**: แสดงรายการสินค้าทั้งหมดของร้าน แก้ไขราคา สต็อก หรือลบสินค้า

---

## 🧩 4. คอมโพเนนต์สำคัญ (Core Components)

### 4.1 `AddressModal.jsx` (ระบบจัดการที่อยู่จัดส่ง)
- **ตำแหน่ง**: `components/product/AddressModal.jsx`
- **ฟังก์ชันสำคัญ**:
  - ระบบเลือก **จังหวัด -> อำเภอ/เขต -> ตำบล/แขวง -> รหัสไปรษณีย์** แบบ Dynamic (Cascading Select)
  - ดึงข้อมูลโครงสร้างสถานที่ไทยจาก `lib/data/thaiLocations.js` (77 จังหวัด 928 อำเภอ/เขต)
  - เติมรหัสไปรษณีย์ให้อัตโนมัติเมื่อเลือกตำบล
  - รองรับการบันทึก (Insert) และแก้ไข (Update) ข้อมูลลงตาราง `addresses` ใน Supabase

### 4.2 `OrderSummary.jsx` (สรุปคำสั่งซื้อ)
- **ตำแหน่ง**: `components/product/OrderSummary.jsx`
- **ฟังก์ชันสำคัญ**:
  - คำนวณราคารวม, ส่วนลดคูปอง, และยอดสุทธิ
  - ดึงและเลือกที่อยู่จัดส่งของผู้ใช้งาน
  - ยืนยันคำสั่งซื้อ และส่งข้อมูลไปยัง `/api/checkout` เพื่อเปิดหน้าชำระเงินผ่าน Stripe

### 4.3 `CouponPopup.jsx` & `Banner.jsx`
- **ตำแหน่ง**: `components/product/CouponPopup.jsx` & `components/layout/Banner.jsx`
- **ฟังก์ชันสำคัญ**:
  - ดึงคูปองส่วนลดที่ใช้งานได้จาก Supabase และแสดงข้อความแจ้งเตือนพร้อมปุ่มคัดลอกรหัส (Copy Code to Clipboard)

---

## ⚡ 5. Backend & API Routes (`app/api/`)

| Route Endpoint | Method | คำอธิบายการทำงาน |
| :--- | :--- | :--- |
| `/api/ai-assistant` | `GET`, `POST`, `DELETE` | ระบบแชท AI ค้นหาสินค้าด้วย Vector Search, จัดการประวัติแชท และล้างประวัติ |
| `/api/checkout` | `POST` | สร้าง Stripe Checkout Session คำนวณยอดเงินรวมและตรวจสอบสต็อกสินค้า |
| `/api/webhook/stripe` | `POST` | Webhook รับการแจ้งเตือนจาก Stripe เมื่อชำระเงินสำเร็จ เพื่ออัปเดตสถานะออเดอร์ใน DB |
| `/api/cart/recommendations` | `POST` | AI วิเคราะห์สินค้าในตะกร้าและแนะนำสินค้าที่เกี่ยวข้องกัน |
| `/api/store/generate-desc` | `POST` | สร้างคำอธิบายสินค้าด้วย Gemini AI สำหรับผู้ขาย |

---

## 🔄 6. การจัดการ State Management (Redux Store)

โปรเจกต์ใช้ **Redux Toolkit** ในการจัดการ Client-side State:
- `cartSlice`: จัดการรายการสินค้าในตะกร้า (เพิ่ม, ลด, ลบ, เคลียร์)
- `addressSlice`: จัดการรายการที่อยู่จัดส่งของผู้ใช้
- `authSlice`: จัดการสถานะและข้อมูลของผู้ใช้ที่เข้าสู่ระบบ
- `favoriteSlice`: จัดการรายการสินค้าโปรด (Wishlist)

---

## 🔒 7. ความปลอดภัยและการยืนยันตัวตน (Authentication & Security)

1. **Clerk Authentication**: ใช้จัดการการเข้าสู่ระบบ (Sign In, Sign Up, OAuth Google)
2. **Supabase Row Level Security (RLS)**: ป้องกันไม่ให้ผู้ใช้เข้าถึงข้อมูลของผู้อื่นโดยไม่ได้รับอนุญาต
3. **Verbatim Module Syntax (TypeScript)**: กำหนดให้ใช้ `import type` สำหรับประเภทข้อมูล เพื่อป้องกัน White Screen Crash ในระบบ TypeScript
