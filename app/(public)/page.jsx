import HomeContent from "./HomeContent"; // Import ไฟล์ที่เราเพิ่งสร้าง

// ✅ Metadata ทำงานได้แล้ว เพราะไฟล์นี้เป็น Server Component
export const metadata = {
  title: "PRT Store | ศูนย์รวมสินค้าไอทีและโน้ตบุ๊กราคาพิเศษ",
  description: "ช้อปสินค้าไอที โน้ตบุ๊ก เกมมิ่งเกียร์ และอุปกรณ์คอมพิวเตอร์คุณภาพสูง ราคาดีที่สุด พร้อมโปรโมชันและคูปองส่วนลดมากมายที่ PRT Store",
  keywords: ["สินค้าไอที", "โน้ตบุ๊ก", "Notebook", "Gaming Gear", "คอมพิวเตอร์", "PRT Store"],
  openGraph: {
    title: "PRT Store - Electronics & IT Store",
    description: "แหล่งรวมสินค้าไอทีและโน้ตบุ๊กราคาพิเศษ พร้อมจัดส่งทั่วไทย",
    images: ['/assets/gs_logo.jpg'],
  },
};

export default function Home() {
    return <HomeContent />;
}