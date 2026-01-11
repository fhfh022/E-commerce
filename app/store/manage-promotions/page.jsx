"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import PageTitle from "@/components/layout/PageTitle";
import Loading from "@/components/layout/Loading";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link"; // ✅ เพิ่ม Link

import { Search, Save, XCircle, ArrowRight, ChevronLeft, ChevronRight, Calculator, Loader2 } from "lucide-react";

export default function ManagePromotions() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [savingId, setSavingId] = useState(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลสินค้าได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const calculateSalePrice = (inputValue, regularPrice) => {
    if (!inputValue || inputValue.trim() === "") return null;

    let finalPrice = null;
    const cleanInput = inputValue.trim();

    if (cleanInput.includes("%")) {
        const percent = parseFloat(cleanInput.replace("%", ""));
        if (!isNaN(percent) && percent > 0 && percent < 100) {
            finalPrice = Math.floor(regularPrice * (1 - percent / 100));
        }
    } else {
        finalPrice = parseFloat(cleanInput);
    }

    return isNaN(finalPrice) ? null : finalPrice;
  };

  const handleUpdateSalePrice = async (product, inputValue) => {
    setSavingId(product.id);
    try {
      const saleValue = calculateSalePrice(inputValue, product.price);
      
      if (saleValue !== null && saleValue >= product.price) {
        toast.error(`ราคาลด (${saleValue}) ต้องน้อยกว่าราคาปกติ (${product.price})`);
        const inputEl = document.getElementById(`price-input-${product.id}`);
        if(inputEl) inputEl.value = product.sale_price || "";
        return;
      }

      if (saleValue !== null && saleValue <= 0) {
         toast.error("ราคาไม่ถูกต้อง");
         return;
      }

      if (saleValue === product.sale_price) return;

      const { error } = await supabase
        .from("products")
        .update({ sale_price: saleValue })
        .eq("id", product.id);

      if (error) throw error;

      setProducts(
        products.map((p) =>
          p.id === product.id ? { ...p, sale_price: saleValue } : p
        )
      );
      
      const message = inputValue.toString().includes("%") 
        ? `บันทึกส่วนลดแล้ว! ราคาใหม่: ${saleValue}`
        : "อัปเดตโปรโมชั่นเรียบร้อยแล้ว!";
        
      toast.success(message);

      const inputEl = document.getElementById(`price-input-${product.id}`);
      if(inputEl) inputEl.value = saleValue || "";

    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSavingId(null);
    }
  };

  const filteredAndSortedProducts = products
    .filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aOnSale = a.sale_price && a.sale_price > 0;
      const bOnSale = b.sale_price && b.sale_price > 0;
      if (aOnSale && !bOnSale) return -1;
      if (!aOnSale && bOnSale) return 1;
      return 0;
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 pb-20 animate-in fade-in duration-500">
      <PageTitle heading="จัดการโปรโมชั่นสินค้า" text="กำหนดราคาลด (ระบุจำนวนเงิน หรือ %)" />

      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 mb-6 gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="ค้นหาสินค้า..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-500 font-medium">
          แสดงทั้งหมด {filteredAndSortedProducts.length} รายการ
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentItems.map((product) => {
           const discountPercent = product.sale_price 
             ? Math.round(((product.price - product.sale_price) / product.price) * 100) 
             : 0;

           return (
            <div key={product.id} className={`bg-white border rounded-2xl p-4 shadow-sm transition-all hover:shadow-md ${product.sale_price ? 'border-green-200 ring-1 ring-green-100' : 'border-slate-100'}`}>
              <div className="flex gap-4 mb-4">
                
                {/* ✅ เพิ่ม Link ครอบรูปสินค้า เพื่อกดไปดูหน้าสินค้าจริงได้ */}
                <Link href={`/product/${product.id}`} target="_blank" className="relative w-20 h-20 bg-slate-50 rounded-lg flex-shrink-0 flex items-center justify-center p-2 group cursor-pointer hover:bg-slate-100 transition">
                  <Image src={product.images?.[0] || "/placeholder.png"} alt={product.name} width={60} height={60} className="object-contain w-full h-full group-hover:scale-105 transition-transform" />
                  {product.sale_price > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                      -{discountPercent}%
                    </span>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  {/* ✅ เพิ่ม Link ที่ชื่อสินค้าด้วย */}
                  <Link href={`/product/${product.id}`} target="_blank" className="font-bold text-slate-800 truncate text-sm hover:text-blue-600 transition block" title={product.name}>
                    {product.name}
                  </Link>
                  <p className="text-xs text-slate-500 mb-2 truncate">{product.model}</p>
                  <div className="text-xs font-medium text-slate-400 bg-slate-50 inline-block px-2 py-1 rounded">
                    ราคาปกติ: {product.price.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-end gap-3 pt-3 border-t border-slate-50">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <Calculator size={10}/> ราคาลด / % ส่วนลด
                  </label>
                  <div className="relative">
                    <input
                        id={`price-input-${product.id}`}
                        type="text"
                        placeholder="เช่น 15900 หรือ 20%"
                        className={`w-full p-2 pl-3 pr-2 text-sm font-bold rounded-lg border outline-none transition focus:ring-2 focus:ring-blue-100 focus:border-blue-400 ${product.sale_price ? 'border-green-300 text-green-700 bg-green-50' : 'border-slate-200 text-slate-700'}`}
                        onBlur={(e) => handleUpdateSalePrice(product, e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.target.blur(); 
                            }
                        }}
                        defaultValue={product.sale_price || ""}
                    />
                  </div>
                </div>
                
                {product.sale_price ? (
                    <button 
                        onClick={() => {
                            const inputEl = document.getElementById(`price-input-${product.id}`);
                            if(inputEl) inputEl.value = ""; 
                            handleUpdateSalePrice(product, ""); 
                        }}
                        disabled={savingId === product.id}
                        className="mb-0.5 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="ยกเลิกส่วนลด"
                    >
                        {savingId === product.id ? <Loader2 size={20} className="animate-spin" /> : <XCircle size={20} />}
                    </button>
                ) : (
                    <div className="mb-0.5 p-2 text-slate-300">
                        <ArrowRight size={20} />
                    </div>
                )}
              </div>
            </div>
           );
        })}
      </div>

      {filteredAndSortedProducts.length > itemsPerPage && (
        <div className="flex justify-center items-center gap-2 mt-10">
            <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                <ChevronLeft size={20} />
            </button>
            
            <span className="text-sm font-bold text-slate-600 px-4 bg-white border border-slate-100 rounded-md py-2 shadow-sm">
                หน้า {currentPage} จาก {totalPages}
            </span>

            <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                <ChevronRight size={20} />
            </button>
        </div>
      )}
    </div>
  );
}