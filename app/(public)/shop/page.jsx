"use client";
import { Suspense, useState, useMemo, useEffect } from "react";
import ProductCard from "@/components/product/ProductCard"; // ตรวจสอบ path component
import { SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { supabase } from "@/lib/supabase";
import { setProduct } from "@/lib/features/product/productSlice";

// กำหนด Brand ที่ต้องการแสดงในตัวกรอง
const BRAND_OPTIONS = ["Asus", "Acer", "HP", "Lenovo", "MSI", "Gigabyte"];

function ShopContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search");

  // Redux Setup
  const dispatch = useDispatch();
  const products = useSelector((state) => state.product.list);

  // Local State
  const [sortOrder, setSortOrder] = useState("default");
  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // -------------------------------------------------------
  // 1️⃣ Fetch Data (ถ้ายังไม่มีใน Redux)
  // -------------------------------------------------------
  // ... (ส่วน useEffect fetchProducts เก็บไว้เหมือนเดิมได้)

  // -------------------------------------------------------
  // 2️⃣ Filter & Sort Logic
  // -------------------------------------------------------
  const handleBrandChange = (brand) => {
    setSelectedBrands((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(brand)) newSet.delete(brand);
      else newSet.add(brand);
      return newSet;
    });
  };

  // ✅ [แก้ไข 1] สร้างตัวแปรกลาง: เก็บเฉพาะสินค้าที่มีสต็อก (in_stock = true)
  // เพื่อนำไปใช้ทั้งในการแสดงผล และการนับจำนวนใน Filter
  const availableProducts = useMemo(() => {
    return products.filter((product) => product.in_stock === true);
  }, [products]);

  // ✅ [แก้ไข 2] ฟังก์ชันนับจำนวน: ให้นับจาก availableProducts แทน products ดิบ
  const getBrandCount = (brandName) => {
    return availableProducts.filter(
      (p) => p.brand?.toLowerCase() === brandName.toLowerCase()
    ).length;
  };

  const finalFilteredProducts = useMemo(() => {
    // ✅ [แก้ไข 3] เริ่มต้นกรองจาก availableProducts (สินค้ามีสต็อกแล้ว)
    let currentProducts = availableProducts;

    // กรองตามคำค้นหา (Search Query from URL)
    if (search) {
      currentProducts = currentProducts.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // กรองตามแบรนด์ที่เลือก (Brand Filter)
    if (selectedBrands.size > 0) {
      currentProducts = currentProducts.filter((product) =>
        Array.from(selectedBrands).some(
          (selected) => selected.toLowerCase() === product.brand?.toLowerCase()
        )
      );
    }

    // เรียงลำดับข้อมูล (Sorting)
    return [...currentProducts].sort((a, b) => {
      switch (sortOrder) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        // Default: เรียงตามวันที่ล่าสุด (Newest Arrivals)
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });
  }, [availableProducts, search, selectedBrands, sortOrder]); // เปลี่ยน dependency เป็น availableProducts

  // -------------------------------------------------------
  // 3️⃣ UI Components (Filter Checkboxes)
  // -------------------------------------------------------
  const FilterSection = ({ isMobile = false }) => (
    <div className={`${isMobile ? "pt-2" : ""}`}>
      <div className="space-y-3">
        {BRAND_OPTIONS.map((brand) => {
          const isSelected = selectedBrands.has(brand);
          const count = getBrandCount(brand); // ตอนนี้จะแสดงเลข 0 ถ้าสินค้าหมดสต็อก

          return (
            <label
              key={brand}
              className={`group flex items-center justify-between cursor-pointer p-2 rounded-lg transition-all duration-200 border border-transparent
                ${
                  isSelected
                    ? "bg-blue-50 border-blue-100"
                    : "hover:bg-slate-50"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`relative flex items-center justify-center w-5 h-5 rounded border transition-colors 
                    ${
                      isSelected
                        ? "bg-blue-600 border-blue-600"
                        : "bg-white border-slate-300 group-hover:border-blue-400"
                    }`}
                >
                  <input
                    type="checkbox"
                    value={brand}
                    checked={isSelected}
                    onChange={() => handleBrandChange(brand)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {isSelected && (
                    <Check size={12} className="text-white" strokeWidth={3} />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    isSelected
                      ? "text-blue-700"
                      : "text-slate-600 group-hover:text-slate-800"
                  }`}
                >
                  {brand}
                </span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isSelected
                    ? "bg-blue-100 text-blue-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {count}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );

  // ... (Loading Check และ UI ส่วน Render หลัก เหมือนเดิม)
  // Loading State
  if (isLoading && products.length === 0) {
     // ... code loading เดิม
     return <div className="min-h-[80vh] flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-[80vh] bg-white py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header: Title & Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">All Products</h1>
            <p className="text-slate-500 text-sm mt-1">
              Found {finalFilteredProducts.length} results{" "}
              {search && `for "${search}"`}
            </p>
          </div>
          {/* ... ส่วน Sort Dropdown เหมือนเดิม ... */}
           <div className="flex items-center gap-3">
             <button
               onClick={() => setIsMobileFilterOpen(true)}
               className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition"
             >
               <SlidersHorizontal size={18} /> Filters
             </button>
             <div className="relative group w-full sm:w-auto">
               <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500">
                 <ChevronDown size={16} />
               </div>
               <select
                 value={sortOrder}
                 onChange={(e) => setSortOrder(e.target.value)}
                 className="w-full sm:w-48 appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
               >
                 <option value="default">Newest Arrivals</option>
                 <option value="price-asc">Price: Low - High</option>
                 <option value="price-desc">Price: High - Low</option>
                 <option value="name-asc">Name: A - Z</option>
                 <option value="name-desc">Name: Z - A</option>
               </select>
             </div>
           </div>
        </div>

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 relative">
          {/* Sidebar (Desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <SlidersHorizontal size={18} className="text-slate-400" />
                <h2 className="text-base font-bold text-slate-800">Brands</h2>
              </div>
              <FilterSection />
            </div>
          </aside>

          {/* Product Grid */}
          <section className="flex-1 min-w-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 xl:gap-8">
              {finalFilteredProducts.length > 0 ? (
                finalFilteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <SlidersHorizontal size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-600">
                    No products found
                  </h3>
                  <p className="text-slate-400 text-sm mt-1 max-w-xs">
                    Try adjusting your search or filter to find what you're looking for.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedBrands(new Set());
                      setSortOrder("default");
                    }}
                    className="mt-6 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      
      {/* Mobile Filter Drawer (คงเดิม) */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${isMobileFilterOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`}>
         <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileFilterOpen(false)} />
         <div className={`absolute top-0 right-0 h-full w-[80%] max-w-xs bg-white shadow-2xl transition-transform duration-300 transform ${isMobileFilterOpen ? "translate-x-0" : "translate-x-full"}`}>
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-lg font-bold text-slate-800">Filter Products</h2>
                    <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-100 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Brands</h3>
                    <FilterSection isMobile={true} />
                </div>
                <div className="p-5 border-t bg-slate-50">
                    <button onClick={() => setIsMobileFilterOpen(false)} className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 active:scale-95 transition shadow-lg">
                        Show Results ({finalFilteredProducts.length})
                    </button>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}