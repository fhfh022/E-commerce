"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Trash2Icon, TicketPercent, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PageTitle from "@/components/layout/PageTitle"; 

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State สำหรับ Form
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    description: "",
    discount_value: "",
    discount_type: "percentage",
    quantity: 100,
    expiry_date: new Date().toISOString().split("T")[0],
    is_active: true,
  });

  // State สำหรับ Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("ไม่สามารถโหลดข้อมูลคูปองได้");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleAddCoupon = async (e) => {
    e.preventDefault();

    try {
      // 1. ตรวจสอบค่าว่าง
      if (!newCoupon.discount_value || !newCoupon.quantity) {
        throw new Error("กรุณาระบุมูลค่าส่วนลดและจำนวนสิทธิ์ให้ถูกต้อง");
      }

      const discountVal = parseInt(newCoupon.discount_value);
      const quantityVal = parseInt(newCoupon.quantity);

      // 2. ตรวจสอบว่าเป็นตัวเลขจริงหรือไม่
      if (isNaN(discountVal) || isNaN(quantityVal)) {
        throw new Error("มูลค่าส่วนลดและจำนวนต้องเป็นตัวเลขเท่านั้น");
      }

      const couponData = {
        code: newCoupon.code.toUpperCase(),
        description: newCoupon.description,
        discount_type: newCoupon.discount_type,
        
        discount_value: discountVal, 
        discount_percent: discountVal, // ใส่ค่าสำรองกัน Error
        
        quantity: quantityVal,
        used_count: 0,
        expiry_date: newCoupon.expiry_date,
        is_active: newCoupon.is_active,
      };

      // 3. Validation เพิ่มเติม
      if (couponData.discount_type === 'percentage' && couponData.discount_value > 100) {
        throw new Error("ส่วนลดเปอร์เซ็นต์ต้องไม่เกิน 100%");
      }

      // 4. ส่งข้อมูลไปยัง Supabase
      const { data, error } = await supabase
        .from("coupons")
        .insert(couponData)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") throw new Error(`รหัสคูปอง "${couponData.code}" มีอยู่แล้วในระบบ!`);
        throw error;
      }

      setCoupons([data, ...coupons]);
      toast.success("สร้างคูปองเรียบร้อยแล้ว");

      // Reset Form
      setNewCoupon({
        code: "",
        description: "",
        discount_value: "",
        discount_type: "percentage",
        quantity: 100,
        expiry_date: new Date().toISOString().split("T")[0],
        is_active: true,
      });

    } catch (error) {
      console.error("Add error details:", JSON.stringify(error, null, 2));
      const message = error.message || error.details || "เกิดข้อผิดพลาดในการสร้างคูปอง";
      toast.error(message);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setNewCoupon({ ...newCoupon, [e.target.name]: value });
  };

  // ฟังก์ชันเปิด Modal ลบ
  const openDeleteModal = (coupon) => {
    setCouponToDelete(coupon);
    setIsDeleteModalOpen(true);
  };

  // ฟังก์ชันยืนยันการลบจริง
  const confirmDeleteCoupon = async () => {
    if (!couponToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("coupons").delete().eq("id", couponToDelete.id);
      if (error) throw error;
      setCoupons(coupons.filter((c) => c.id !== couponToDelete.id));
      toast.success(`ลบคูปอง "${couponToDelete.code}" เรียบร้อยแล้ว`);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("ไม่สามารถลบคูปองได้");
    } finally {
      setIsDeleting(false);
      setCouponToDelete(null);
    }
  };

  // ✅ ฟังก์ชันเปิด-ปิดสถานะคูปอง (Toggle Status)
  const toggleStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: !currentStatus }) // สลับค่า True/False
        .eq("id", id);

      if (error) throw error;

      // อัปเดต State ทันทีเพื่อให้ UI เปลี่ยนไว
      setCoupons(
        coupons.map((c) =>
          c.id === id ? { ...c, is_active: !currentStatus } : c
        )
      );
      
      toast.success(currentStatus ? "ปิดใช้งานคูปองแล้ว" : "เปิดใช้งานคูปองแล้ว");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("ไม่สามารถอัปเดตสถานะได้");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pt-10 pb-20 text-slate-500 animate-in fade-in duration-500">
      <PageTitle heading="จัดการคูปองส่วนลด" text="สร้างและจัดการโค้ดส่วนลดสำหรับร้านค้า" />
      
      <div className="mt-8 flex flex-col lg:flex-row items-start gap-8">
        
        {/* ---- ส่วนที่ 1: Add Coupon Form (ด้านซ้าย) ---- */}
        <div className="w-full lg:max-w-md bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:sticky top-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
              <TicketPercent size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">เพิ่มคูปองใหม่</h2>
          </div>

          <form onSubmit={handleAddCoupon} className="flex flex-col gap-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">รหัสคูปอง (Code)</label>
              <input
                type="text"
                name="code"
                placeholder="ตัวอย่าง: SALE2024"
                value={newCoupon.code}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition font-medium uppercase"
                required
              />
            </div>

            <div className="flex gap-4">
              <div className="w-1/2">
                 <label className="block text-xs font-bold text-slate-400 uppercase mb-1">ประเภทส่วนลด</label>
                 <select 
                   name="discount_type"
                   value={newCoupon.discount_type}
                   onChange={handleChange}
                   className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition"
                 >  
                   <option value="percentage">เปอร์เซ็นต์ (%)</option>
                   <option value="fixed">จำนวนเงินคงที่ (฿)</option>
                 </select>
              </div>
              <div className="w-1/2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">มูลค่าส่วนลด</label>
                <input
                  type="number"
                  name="discount_value"
                  placeholder={newCoupon.discount_type === 'percentage' ? "ระบุ 1-100" : "ระบุจำนวนเงิน"}
                  value={newCoupon.discount_value}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition text-center font-medium"
                  required
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">จำนวนสิทธิ์ทั้งหมด</label>
              <input
                type="number"
                name="quantity"
                placeholder="เช่น 100"
                value={newCoupon.quantity}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">รายละเอียด</label>
              <input
                type="text"
                name="description"
                placeholder="รายละเอียดสั้นๆ เกี่ยวกับส่วนลดนี้"
                value={newCoupon.description}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">วันหมดอายุ</label>
              <input
                type="date"
                name="expiry_date"
                value={newCoupon.expiry_date}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition text-slate-600"
                required
              />
            </div>

            <div className="flex items-center gap-3 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <input
                type="checkbox"
                id="isActive"
                name="is_active"
                checked={newCoupon.is_active}
                onChange={handleChange}
                className="accent-blue-600 size-4 cursor-pointer"
              />
              <label htmlFor="isActive" className="cursor-pointer select-none text-slate-700 font-medium">
                เปิดใช้งานคูปองทันที
              </label>
            </div>

            <button disabled={isLoading} className="mt-2 w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition shadow-lg shadow-slate-200 disabled:opacity-70">
              สร้างคูปอง
            </button>
          </form>
        </div>

        {/* ---- ส่วนที่ 2: List Coupons (ด้านขวา) ---- */}
        <div className="flex-1 w-full">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            คูปองที่ใช้งานอยู่ <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{coupons.length}</span>
          </h2>

          {isLoading ? (
            <div className="text-center py-10 flex items-center justify-center gap-2 text-slate-400">
                <Loader2 size={20} className="animate-spin" /> กำลังโหลดข้อมูล...
            </div>
          ) : (
            <div className="max-w-[calc(100vw-3rem)] lg:max-w-none bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-bold text-slate-400">
                    <tr>
                      <th className="py-4 px-6">รหัส</th>
                      <th className="py-4 px-6">รายละเอียด</th>
                      <th className="py-4 px-6 text-center">ส่วนลด</th>
                      <th className="py-4 px-6 text-center">การใช้งาน</th>
                      <th className="py-4 px-6">หมดอายุ</th>
                      <th className="py-4 px-6 text-center">สถานะ</th>
                      <th className="py-4 px-6 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {coupons.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="text-center py-8 text-slate-400">ยังไม่มีคูปองที่สร้างไว้</td>
                        </tr>
                    ) : (
                        coupons.map((coupon) => {
                          // --- Logic คำนวณสถานะ ---
                          const today = new Date();
                          today.setHours(0, 0, 0, 0); // ตัดเวลาออก เอาแค่วันที่
                          
                          const expiryDate = new Date(coupon.expiry_date);
                          const isExpired = today > expiryDate;
                          const isSoldOut = coupon.used_count >= coupon.quantity;

                          let statusLabel = "ใช้งานได้";
                          let statusColor = "bg-green-100 text-green-700";

                          // เรียงลำดับความสำคัญของสถานะ
                          if (!coupon.is_active) {
                            statusLabel = "ปิดใช้งาน";
                            statusColor = "bg-slate-100 text-slate-500";
                          } else if (isExpired) {
                            statusLabel = "หมดอายุ";
                            statusColor = "bg-red-100 text-red-600";
                          } else if (isSoldOut) {
                            statusLabel = "สิทธิ์เต็ม";
                            statusColor = "bg-orange-100 text-orange-600";
                          }

                          return (
                            <tr key={coupon.id} className="hover:bg-slate-50/50 transition">
                                <td className="py-4 px-6 font-bold text-slate-800 font-mono tracking-wide">{coupon.code}</td>
                                <td className="py-4 px-6 text-slate-600 max-w-[200px] truncate" title={coupon.description}>{coupon.description}</td>
                                <td className="py-4 px-6 text-center font-bold text-green-600">
                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `฿${coupon.discount_value.toLocaleString()}`}
                                </td>
                                <td className="py-4 px-6 text-center text-slate-600">
                                <span className={isSoldOut ? "text-red-500 font-bold" : ""}>
                                    {coupon.used_count}
                                </span> 
                                / {coupon.quantity}
                                </td>
                                <td className={`py-4 px-6 ${isExpired ? "text-red-500 font-medium" : "text-slate-500"}`}>
                                {new Date(coupon.expiry_date).toLocaleDateString('th-TH', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'})}</td>
                                
                                {/* ✅ ส่วน Switch + Badge Status */}
                                <td className="py-4 px-6 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor} min-w-[70px] inline-block`}>
                                            {statusLabel}
                                        </span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={coupon.is_active}
                                                onChange={() => toggleStatus(coupon.id, coupon.is_active)}
                                            />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </td>

                                <td className="py-4 px-6 text-right">
                                <button onClick={() => openDeleteModal(coupon)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="ลบคูปอง">
                                    <Trash2Icon size={18} />
                                </button>
                                </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && couponToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl max-w-sm w-full transform transition-all scale-100 animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center">
              
              <div className="p-4 rounded-full mb-4 bg-red-100 text-red-600">
                <AlertTriangle size={32} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">
                ยืนยันการลบคูปอง?
              </h3>

              <p className="text-slate-500 mb-6 text-sm md:text-base leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบคูปอง <span className="font-bold text-slate-800">"{couponToDelete.code}"</span>? <br/> การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmDeleteCoupon}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 text-white rounded-xl font-bold transition shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center bg-red-600 hover:bg-red-700 shadow-red-200"
                >
                  {isDeleting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    "ใช่, ลบเลย"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}