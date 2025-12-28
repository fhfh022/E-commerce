"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import PageTitle from "@/components/layout/PageTitle";
import Loading from "@/components/layout/Loading";
import toast from "react-hot-toast";
import Image from "next/image";
import { Search, Save, XCircle, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export default function ManagePromotions() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [savingId, setSavingId] = useState(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // จำนวนสินค้าต่อหน้า

  // ดึงสินค้าทั้งหมด
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ฟังก์ชันบันทึกราคา Sale
  const handleUpdateSalePrice = async (productId, newSalePrice) => {
    setSavingId(productId);
    try {
      const saleValue = newSalePrice ? parseFloat(newSalePrice) : null;
      const product = products.find((p) => p.id === productId);
      
      if (saleValue && saleValue >= product.price) {
        toast.error("Sale price must be lower than regular price");
        return;
      }

      const { error } = await supabase
        .from("products")
        .update({ sale_price: saleValue })
        .eq("id", productId);

      if (error) throw error;

      // Update Local State
      setProducts(
        products.map((p) =>
          p.id === productId ? { ...p, sale_price: saleValue } : p
        )
      );
      toast.success("Promotion updated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update");
    } finally {
      setSavingId(null);
    }
  };

  // ✅ 1. Logic การกรองและเรียงลำดับ (Sale ขึ้นก่อน)
  const filteredAndSortedProducts = products
    .filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aOnSale = a.sale_price && a.sale_price > 0;
      const bOnSale = b.sale_price && b.sale_price > 0;
      // ให้สินค้าที่ลดราคา (On Sale) ขึ้นก่อน
      if (aOnSale && !bOnSale) return -1;
      if (!aOnSale && bOnSale) return 1;
      return 0; // ถ้าเหมือนกันให้ยึดตาม created_at เดิม
    });

  // ✅ 2. Logic Pagination (ตัดแบ่งหน้า)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // รีเซ็ตหน้าเมื่อค้นหา
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 pb-20">
      <PageTitle heading="Product Promotions" text="Set sale prices for your items" />

      {/* Search Bar */}
      <div className="flex justify-between items-center mt-6 mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-500 font-medium">
          Showing {filteredAndSortedProducts.length} products
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentItems.map((product) => {
           const discountPercent = product.sale_price 
             ? Math.round(((product.price - product.sale_price) / product.price) * 100) 
             : 0;

           return (
            <div key={product.id} className={`bg-white border rounded-2xl p-4 shadow-sm transition-all ${product.sale_price ? 'border-green-200 ring-1 ring-green-100' : 'border-slate-100'}`}>
              <div className="flex gap-4 mb-4">
                <div className="relative w-20 h-20 bg-slate-50 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <Image src={product.images?.[0] || "/placeholder.png"} alt={product.name} width={60} height={60} className="object-contain" />
                  {product.sale_price > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                      -{discountPercent}%
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate" title={product.name}>{product.name}</h3>
                  <p className="text-xs text-slate-500 mb-1">{product.model}</p>
                  <div className="text-sm font-medium text-slate-400">Regular: ${product.price.toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-50">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Sale Price ($)</label>
                  <div className="relative">
                    <input
                        type="number"
                        placeholder="No Sale"
                        className={`w-full p-2 pl-3 pr-2 text-sm font-bold rounded-lg border outline-none transition ${product.sale_price ? 'border-green-300 text-green-700 bg-green-50' : 'border-slate-200 text-slate-700'}`}
                        onBlur={(e) => {
                            // เช็คก่อนว่าค่าเปลี่ยนจริงไหมค่อยยิง API
                            const val = e.target.value ? parseFloat(e.target.value) : null;
                            if (val !== product.sale_price) {
                                handleUpdateSalePrice(product.id, e.target.value);
                            }
                        }}
                        defaultValue={product.sale_price || ""}
                    />
                  </div>
                </div>
                
                {product.sale_price ? (
                    <button 
                        onClick={() => handleUpdateSalePrice(product.id, null)}
                        disabled={savingId === product.id}
                        className="mt-5 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Clear Sale"
                    >
                        {savingId === product.id ? "..." : <XCircle size={20} />}
                    </button>
                ) : (
                    <div className="mt-5 p-2 text-slate-300">
                        <ArrowRight size={20} />
                    </div>
                )}
              </div>
            </div>
           );
        })}
      </div>

      {/* ✅ 3. Pagination UI */}
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
                Page {currentPage} of {totalPages}
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