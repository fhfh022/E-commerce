"use client";
import { useSelector } from "react-redux";
import ProductCard from "@/components/product/ProductCard";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";

export default function FavoritesPage() {
  const { isLoaded, isSignedIn } = useUser();
  // --- ส่วนของ Logic ด้านล่างจะทำงานเมื่อ User ล็อกอินเรียบร้อยแล้วเท่านั้น ---

  // 1. ดึงรายการ ID สินค้าที่ชอบจาก Redux
  const favoriteIds = useSelector((state) => state.favorite.items);

  // 2. ดึงรายการสินค้าทั้งหมดที่มีอยู่ใน Store
  const allProducts = useSelector((state) => state.product.list);

  // 1. ถ้า Clerk ยังโหลดสถานะไม่เสร็จ ให้แสดงหน้าขาวว่างๆ (min-h-screen)
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner หรือ Icon โหลด */}
          <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin" />

          {/* ข้อความแจ้งเตือน */}
          <p className="text-slate-500 font-medium animate-pulse">
            {!isLoaded
              ? "Loading your favorites..."
              : "Redirecting to login..."}
          </p>
        </div>

        {/* ถ้าตรวจสอบเสร็จแล้วว่าไม่ได้ Login ให้เรียก Redirect ภายใน Div ที่ทับหน้านี้ */}
        {!isLoaded ? null : <RedirectToSignIn />}
      </div>
    );
  }

  // 3. กรองเฉพาะสินค้าที่มี ID ตรงกับในรายการโปรด
  const favoriteProducts = allProducts.filter((product) =>
    favoriteIds.includes(product.id)
  );

  return (
    <div className="min-h-screen bg-white animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">My Favorites</h1>
        <p className="text-slate-500 mb-8">
          You have {favoriteProducts.length} items in your wishlist.
        </p>

        <hr className="mb-10 border-slate-200" />

        {favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-10">
            {favoriteProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-slate-100 p-6 rounded-full mb-4">
              <svg
                className="w-12 h-12 text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-700">
              No favorites yet
            </h2>
            <p className="text-slate-400 mt-2">
              Start adding some items you love!
            </p>
            <a
              href="/shop"
              className="mt-6 bg-slate-900 text-white px-6 py-2 rounded-md hover:bg-slate-800 transition"
            >
              Go Shopping
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
