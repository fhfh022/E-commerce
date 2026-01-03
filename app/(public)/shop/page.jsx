"use client";
import { Suspense, useState, useMemo, useEffect } from "react";
import ProductCard from "@/components/product/ProductCard";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
// import { supabase } from "@/lib/supabase"; // ไม่ได้ใช้ในหน้านี้ (ถ้าไม่ได้ fetch สด)
// import { setProduct } from "@/lib/features/product/productSlice"; // ไม่ได้ใช้ dispatch ในหน้านี้

// กำหนด Options
const BRAND_OPTIONS = ["Asus", "Acer", "HP", "Lenovo", "MSI", "Gigabyte"];
const CATEGORY_OPTIONS = ["Ultrabook", "Gaming"];

function ShopContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search");

  // Redux Setup
  const dispatch = useDispatch();
  const products = useSelector((state) => state.product.list);

  // Local State
  const [sortOrder, setSortOrder] = useState("default");
  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Loading & Pagination State
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // -------------------------------------------------------
  // Logic Handlers
  // -------------------------------------------------------

  // ✅ FIX: ปิด Loading เมื่อ products มีข้อมูล หรือผ่านไปสักระยะ
  useEffect(() => {
    if (products.length > 0) {
      setIsLoading(false);
    } else {
      // กรณีไม่มีสินค้าเลย อาจจะตั้ง Timeout เพื่อปิด Loading ไม่ให้หมุนค้าง
      const timer = setTimeout(() => setIsLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [products]);

  const availableProducts = useMemo(() => {
    return products.filter((product) => product.in_stock === true);
  }, [products]);

  // Count Helpers
  const getBrandCount = (brandName) => {
    return availableProducts.filter(
      (p) => p.brand?.toLowerCase() === brandName.toLowerCase()
    ).length;
  };

  const getCategoryCount = (categoryName) => {
    return availableProducts.filter(
      (p) => p.category?.toLowerCase() === categoryName.toLowerCase()
    ).length;
  };

  // Main Filter Logic
  const finalFilteredProducts = useMemo(() => {
    let currentProducts = availableProducts;

    // Filter by Search
    if (search) {
      currentProducts = currentProducts.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by Brand
    if (selectedBrands.size > 0) {
      currentProducts = currentProducts.filter((product) =>
        Array.from(selectedBrands).some(
          (selected) => selected.toLowerCase() === product.brand?.toLowerCase()
        )
      );
    }

    // Filter by Category
    if (selectedCategories.size > 0) {
      currentProducts = currentProducts.filter((product) =>
        Array.from(selectedCategories).some(
          (selected) =>
            selected.toLowerCase() === product.category?.toLowerCase()
        )
      );
    }

    // Sort
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
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });
  }, [
    availableProducts,
    search,
    selectedBrands,
    selectedCategories,
    sortOrder,
  ]);

  // --- Pagination Logic ---
  
  // 1. Reset หน้าไปที่ 1 เสมอเมื่อมีการเปลี่ยน Filter
  useEffect(() => {
    setCurrentPage(1);
  }, [finalFilteredProducts]); // เมื่อผลลัพธ์การกรองเปลี่ยน ให้กลับหน้า 1

  // 2. คำนวณหาจำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(finalFilteredProducts.length / itemsPerPage);

  // 3. ตัด Array เพื่อเลือกเฉพาะสินค้าที่จะโชว์ในหน้านั้น
  const currentProducts = finalFilteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 4. ฟังก์ชันเปลี่ยนหน้า
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Checkbox Handlers
  const handleBrandChange = (brand) => {
    setSelectedBrands((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(brand)) newSet.delete(brand);
      else newSet.add(brand);
      return newSet;
    });
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) newSet.delete(category);
      else newSet.add(category);
      return newSet;
    });
  };

  // -------------------------------------------------------
  // UI Components
  // -------------------------------------------------------
  const FilterSection = ({ isMobile = false }) => (
    <div className={`${isMobile ? "pt-2" : ""}`}>
      {/* 🏷️ Brands Group */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Brands
        </h3>
        <div className="space-y-2">
          {BRAND_OPTIONS.map((brand) => {
            const isSelected = selectedBrands.has(brand);
            const count = getBrandCount(brand);
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
                    className={`relative flex items-center justify-center w-4 h-4 rounded border transition-colors ${
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
                      <Check size={10} className="text-white" strokeWidth={3} />
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

      {/* 💻 Categories Group */}
      <div>
        <div className="flex items-center gap-2 mb-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Categories
          </h3>
        </div>
        <div className="space-y-2">
          {CATEGORY_OPTIONS.map((category) => {
            const isSelected = selectedCategories.has(category);
            const count = getCategoryCount(category);
            return (
              <label
                key={category}
                className={`group flex items-center justify-between cursor-pointer p-2 rounded-lg transition-all duration-200 border border-transparent
                  ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-100"
                      : "hover:bg-slate-50"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`relative flex items-center justify-center w-4 h-4 rounded border transition-colors ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-white border-slate-300 group-hover:border-indigo-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={category}
                      checked={isSelected}
                      onChange={() => handleCategoryChange(category)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {isSelected && (
                      <Check size={10} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isSelected
                        ? "text-indigo-700"
                        : "text-slate-600 group-hover:text-slate-800"
                    }`}
                  >
                    {category}
                  </span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-indigo-100 text-indigo-600"
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
    </div>
  );

  // Loading View
  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
             <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
             <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-white py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">All Products</h1>
            <p className="text-slate-500 text-sm mt-1">
              Found {finalFilteredProducts.length} results{" "}
              {search && `for "${search}"`}
            </p>
          </div>
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
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
                <SlidersHorizontal size={18} className="text-slate-400" />
                <h2 className="text-base font-bold text-slate-800">Filters</h2>
              </div>
              <FilterSection />
            </div>
          </aside>

          {/* Product Grid */}
          <section className="flex-1 min-w-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 xl:gap-8">
              {/* ✅ FIX: ใช้ currentProducts แทน finalFilteredProducts เพื่อให้ Pagination ทำงาน */}
              {currentProducts.length > 0 ? (
                currentProducts.map((product) => (
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
                    Try adjusting your search or filter to find what you're
                    looking for.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedBrands(new Set());
                      setSelectedCategories(new Set());
                      setSortOrder("default");
                    }}
                    className="mt-6 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-12 mb-8">
                {/* ปุ่มย้อนกลับ */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                >
                  <ChevronLeft size={20} />
                </button>

                {/* แสดงเลขหน้า */}
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all duration-200 font-medium ${
                        currentPage === page
                          ? "bg-slate-900 text-white border-slate-900 shadow-md"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* ปุ่มถัดไป */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}

          </section>
        </div>
      </div>


      {/* Mobile Filter Drawer (Left Slide) */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          isMobileFilterOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsMobileFilterOpen(false)}
        />

        {/* Drawer Container: Left Side */}
        <div
          className={`absolute top-0 left-0 h-full w-[80%] max-w-xs bg-white shadow-2xl transition-transform duration-300 transform ${
            isMobileFilterOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-slate-800">
                Filter Products
              </h2>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 text-slate-400 hover:text-red-500 bg-slate-100 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <FilterSection isMobile={true} />
            </div>

            <div className="p-5 border-t bg-slate-50">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 active:scale-95 transition shadow-lg"
              >
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