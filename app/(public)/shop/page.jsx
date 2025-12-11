"use client";
import { Suspense, useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import { MoveLeftIcon, SlidersHorizontal, X } from "lucide-react"; 
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";

function ShopContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search");
  const router = useRouter();

  const [sortOrder, setSortOrder] = useState("default");
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const products = useSelector((state) => state.product.list);

  // Logic ดึง Categories ทั้งหมด
  const allCategories = useMemo(() => {
    const categories = new Set(products.map(p => p.category));
    return Array.from(categories);
  }, [products]);

  // Logic เลือก Categories Checkbox
  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Logic กรองและจัดเรียงสินค้า
  const finalFilteredProducts = useMemo(() => {
    let currentProducts = products;

    if (search) {
      currentProducts = currentProducts.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedCategories.size > 0) {
      currentProducts = currentProducts.filter((product) =>
        selectedCategories.has(product.category)
      );
    }
    
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
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }, [products, search, selectedCategories, sortOrder]);


  // Helper Render Checkboxes
  const renderFilterCheckboxes = (isMobile = false) => (
    <div className={`flex flex-col gap-2 ${isMobile ? 'pt-4' : ''}`}>
        {allCategories.map((category) => (
            <label 
                key={category} 
                className="flex items-center space-x-2 text-slate-600 cursor-pointer hover:text-green-600 transition"
            >
                <input
                    type="checkbox"
                    value={category}
                    checked={selectedCategories.has(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="size-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span>{category}</span>
                <span className="text-xs text-slate-400">
                    ({products.filter(p => p.category === category).length})
                </span>
            </label>
        ))}
        {allCategories.length === 0 && (
            <p className="text-sm text-slate-400">ไม่พบประเภทสินค้า</p>
        )}
    </div>
  );


  return (
    <div className="min-h-[70vh] mx-6 py-8">
      <div className="max-w-7xl mx-auto">
        
        {/* ================= HEADER SECTION (แก้ไขใหม่) ================= */}
        <div className="flex items-center mb-8">
          
          {/* 1. ปุ่ม Filter (ย้ายมาซ้ายสุด แทนที่ Title เดิม) */}
          {/* lg:hidden = แสดงเฉพาะจอ Mobile/Tablet */}
          <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm"
          >
              <SlidersHorizontal size={18} /> 
              Filter
          </button>

          {/* 2. Sort Dropdown (อยู่ขวาสุดเสมอ) */}
          {/* ml-auto = ดันตัวเองไปทางขวาสุดของ Flex container */}
          <div className="flex items-center gap-3 ml-auto">
              <span className="text-sm text-slate-500 hidden sm:block">เรียงตาม:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 cursor-pointer bg-white shadow-sm"
              >
                <option value="default">สินค้ามาใหม่</option>
                <option value="price-asc">ราคา: ต่ำสุดไปสูงสุด</option>
                <option value="price-desc">ราคา: สูงสุดไปต่ำสุด</option>
                <option value="name-asc">ชื่อสินค้า: A - Z</option>
                <option value="name-desc">ชื่อสินค้า: Z - A</option>
              </select>
          </div>
        </div>
        {/* ============================================================ */}


        {/* MAIN LAYOUT: 2 COLUMNS */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative"> 
            
            {/* SIDEBAR (DESKTOP) */}
            <aside className="w-64 hidden lg:block h-fit flex-shrink-0">
                <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-2">
                    ประเภทสินค้า
                </h2>
                {renderFilterCheckboxes()}
            </aside>

            {/* PRODUCT GRID */}
            <section className="flex-1 min-w-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 xl:gap-x-8 xl:gap-y-12 mb-32">
                    {finalFilteredProducts.length > 0 ? (
                        finalFilteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <p className="text-xl text-slate-400 font-medium">ไม่พบสินค้า</p>
                            <p className="text-slate-400 text-sm mt-2">กรุณาลองปรับการค้นหาหรือตัวกรองประเภทสินค้า</p>
                        </div>
                    )}
                </div>
            </section>
        </div> 

      </div>

      {/* MOBILE FILTER MODAL */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-white p-6 overflow-y-auto lg:hidden transition-transform duration-300">
             <div className="flex justify-between items-center mb-6 border-b pb-4">
                 <h2 className="text-2xl font-bold text-slate-700">Filter Products</h2>
                 <button onClick={() => setIsMobileFilterOpen(false)} className="text-slate-600 hover:text-red-500 transition">
                     <X size={24} />
                 </button>
             </div>
             
             <div className="mb-24">
                 <h3 className="text-xl font-semibold text-slate-700 mb-3">ประเภทสินค้า</h3>
                 {renderFilterCheckboxes(true)}
             </div>

             <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t shadow-2xl">
                 <button 
                    onClick={() => setIsMobileFilterOpen(false)} 
                    className="w-full py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
                 >
                     แสดงผลลัพธ์ ({finalFilteredProducts.length} ชิ้น)
                 </button>
             </div>
        </div>
      )}

    </div>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">กำลังโหลด...</div>}>
      <ShopContent />
    </Suspense>
  );
}