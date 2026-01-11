"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Trash2Icon, TicketPercent, AlertTriangle, Loader2, Edit, Save, X } from "lucide-react"; // ✅ เพิ่ม Icon Edit, Save, X
import { supabase } from "@/lib/supabase";
import PageTitle from "@/components/layout/PageTitle"; 

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State สำหรับ Form เพิ่ม
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

  // ✅ State สำหรับ Edit Modal (เพิ่มใหม่)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

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

  // --- Handlers สำหรับเพิ่มคูปอง ---
  const handleAddCoupon = async (e) => {
    e.preventDefault();
    try {
      if (!newCoupon.discount_value || !newCoupon.quantity) throw new Error("กรุณาระบุข้อมูลให้ครบถ้วน");

      const discountVal = parseInt(newCoupon.discount_value);
      const quantityVal = parseInt(newCoupon.quantity);

      if (isNaN(discountVal) || isNaN(quantityVal)) throw new Error("ค่าต้องเป็นตัวเลขเท่านั้น");
      if (newCoupon.discount_type === 'percentage' && discountVal > 100) throw new Error("ส่วนลด % ต้องไม่เกิน 100");

      const couponData = {
        code: newCoupon.code.toUpperCase(),
        description: newCoupon.description,
        discount_type: newCoupon.discount_type,
        discount_value: discountVal,
        discount_percent: discountVal,
        quantity: quantityVal,
        used_count: 0,
        expiry_date: newCoupon.expiry_date,
        is_active: newCoupon.is_active,
      };

      const { data, error } = await supabase.from("coupons").insert(couponData).select().single();

      if (error) {
        if (error.code === "23505") throw new Error(`รหัส "${couponData.code}" มีอยู่แล้ว`);
        throw error;
      }

      setCoupons([data, ...coupons]);
      toast.success("สร้างคูปองสำเร็จ");
      setNewCoupon({
        code: "", description: "", discount_value: "", discount_type: "percentage",
        quantity: 100, expiry_date: new Date().toISOString().split("T")[0], is_active: true,
      });

    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setNewCoupon({ ...newCoupon, [e.target.name]: value });
  };

  // --- Handlers สำหรับลบ ---
  const openDeleteModal = (coupon) => {
    setCouponToDelete(coupon);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCoupon = async () => {
    if (!couponToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("coupons").delete().eq("id", couponToDelete.id);
      if (error) throw error;
      setCoupons(coupons.filter((c) => c.id !== couponToDelete.id));
      toast.success("ลบคูปองสำเร็จ");
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error("ไม่สามารถลบคูปองได้");
    } finally {
      setIsDeleting(false);
      setCouponToDelete(null);
    }
  };

  // --- Handlers สำหรับสถานะ ---
  const toggleStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase.from("coupons").update({ is_active: !currentStatus }).eq("id", id);
      if (error) throw error;
      setCoupons(coupons.map((c) => c.id === id ? { ...c, is_active: !currentStatus } : c));
      toast.success(currentStatus ? "ปิดใช้งานแล้ว" : "เปิดใช้งานแล้ว");
    } catch (error) {
      toast.error("อัปเดตสถานะไม่สำเร็จ");
    }
  };

  // --- ✅ Handlers สำหรับแก้ไข (เพิ่มใหม่) ---
  const openEditModal = (coupon) => {
    setEditingCoupon({
        ...coupon,
        // แปลงวันที่ให้ตรงกับ input type="date"
        expiry_date: new Date(coupon.expiry_date).toISOString().split('T')[0]
    });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setEditingCoupon({ ...editingCoupon, [e.target.name]: value });
  };

  const handleUpdateCoupon = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
        const discountVal = parseInt(editingCoupon.discount_value);
        const quantityVal = parseInt(editingCoupon.quantity);

        if (isNaN(discountVal) || isNaN(quantityVal)) throw new Error("ค่าต้องเป็นตัวเลข");
        if (editingCoupon.discount_type === 'percentage' && discountVal > 100) throw new Error("ส่วนลด % ต้องไม่เกิน 100");

        const updatedData = {
            code: editingCoupon.code.toUpperCase(),
            description: editingCoupon.description,
            discount_type: editingCoupon.discount_type,
            discount_value: discountVal,
            discount_percent: discountVal,
            quantity: quantityVal,
            expiry_date: editingCoupon.expiry_date,
            is_active: editingCoupon.is_active
        };

        const { error } = await supabase
            .from('coupons')
            .update(updatedData)
            .eq('id', editingCoupon.id);

        if (error) throw error;

        // อัปเดต State หน้าจอ
        setCoupons(coupons.map(c => c.id === editingCoupon.id ? { ...c, ...updatedData } : c));
        toast.success("อัปเดตข้อมูลคูปองเรียบร้อย");
        setIsEditModalOpen(false);

    } catch (error) {
        console.error(error);
        toast.error(error.message || "เกิดข้อผิดพลาดในการแก้ไข");
    } finally {
        setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pt-10 pb-20 text-slate-500 animate-in fade-in duration-500">
      <PageTitle heading="จัดการคูปองส่วนลด" text="สร้างและจัดการโค้ดส่วนลดสำหรับร้านค้า" />
      
      <div className="mt-8 flex flex-col lg:flex-row items-start gap-8">
        
        {/* ---- Add Form ---- */}
        <div className="w-full lg:max-w-md bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:sticky top-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
              <TicketPercent size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">เพิ่มคูปองใหม่</h2>
          </div>

          <form onSubmit={handleAddCoupon} className="flex flex-col gap-4 text-sm">
            {/* ... (Form Fields เดิม เหมือนเดิมทุกประการ) ... */}
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
                 <select name="discount_type" value={newCoupon.discount_type} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition">  
                   <option value="percentage">เปอร์เซ็นต์ (%)</option>
                   <option value="fixed">จำนวนเงิน (฿)</option>
                 </select>
              </div>
              <div className="w-1/2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">มูลค่าส่วนลด</label>
                <input type="number" name="discount_value" placeholder={newCoupon.discount_type === 'percentage' ? "1-100" : "จำนวนเงิน"} value={newCoupon.discount_value} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition text-center font-medium" required min="0" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">จำนวนสิทธิ์</label>
              <input type="number" name="quantity" placeholder="เช่น 100" value={newCoupon.quantity} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition" required min="1" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">รายละเอียด</label>
              <input type="text" name="description" placeholder="รายละเอียดสั้นๆ" value={newCoupon.description} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">วันหมดอายุ</label>
              <input type="date" name="expiry_date" value={newCoupon.expiry_date} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition text-slate-600" required />
            </div>
            <button disabled={isLoading} className="mt-2 w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition shadow-lg shadow-slate-200 disabled:opacity-70">สร้างคูปอง</button>
          </form>
        </div>

        {/* ---- Coupon List ---- */}
        <div className="flex-1 w-full">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            คูปองที่ใช้งานอยู่ <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{coupons.length}</span>
          </h2>

          {isLoading ? (
            <div className="text-center py-10 flex items-center justify-center gap-2 text-slate-400">
                <Loader2 size={20} className="animate-spin" /> กำลังโหลด...
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
                      <th className="py-4 px-6 text-center">ใช้ไป</th>
                      <th className="py-4 px-6">หมดอายุ</th>
                      <th className="py-4 px-6 text-center">สถานะ</th>
                      <th className="py-4 px-6 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {coupons.length === 0 ? (
                        <tr><td colSpan="7" className="text-center py-8 text-slate-400">ยังไม่มีคูปอง</td></tr>
                    ) : (
                        coupons.map((coupon) => {
                          const today = new Date(); today.setHours(0,0,0,0);
                          const isExpired = today > new Date(coupon.expiry_date);
                          const isSoldOut = coupon.used_count >= coupon.quantity;
                          let statusLabel = "ใช้งานได้"; let statusColor = "bg-green-100 text-green-700";
                          if (!coupon.is_active) { statusLabel = "ปิดใช้งาน"; statusColor = "bg-slate-100 text-slate-500"; }
                          else if (isExpired) { statusLabel = "หมดอายุ"; statusColor = "bg-red-100 text-red-600"; }
                          else if (isSoldOut) { statusLabel = "สิทธิ์เต็ม"; statusColor = "bg-orange-100 text-orange-600"; }

                          return (
                            <tr key={coupon.id} className="hover:bg-slate-50/50 transition">
                                <td className="py-4 px-6 font-bold text-slate-800 font-mono">{coupon.code}</td>
                                <td className="py-4 px-6 text-slate-600 max-w-[150px] truncate">{coupon.description}</td>
                                <td className="py-4 px-6 text-center font-bold text-green-600">
                                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `฿${coupon.discount_value}`}
                                </td>
                                <td className="py-4 px-6 text-center text-slate-600">
                                    <span className={isSoldOut ? "text-red-500 font-bold" : ""}>{coupon.used_count}</span> / {coupon.quantity}
                                </td>
                                <td className={`py-4 px-6 ${isExpired ? "text-red-500" : ""}`}>
                                    {new Date(coupon.expiry_date).toLocaleDateString('th-TH', {day:'2-digit', month:'short', year:'2-digit'})}
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor} min-w-[70px] inline-block`}>{statusLabel}</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={coupon.is_active} onChange={() => toggleStatus(coupon.id, coupon.is_active)} />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        {/* ✅ ปุ่ม Edit */}
                                        <button onClick={() => openEditModal(coupon)} className="p-2 text-slate-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition" title="แก้ไข">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => openDeleteModal(coupon)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="ลบ">
                                            <Trash2Icon size={18} />
                                        </button>
                                    </div>
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

      {/* ✅ EDIT MODAL (เพิ่มใหม่) */}
      {isEditModalOpen && editingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg relative animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Edit className="text-yellow-500" /> แก้ไขคูปอง
                    </h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full transition text-slate-400"><X size={24}/></button>
                </div>

                <form onSubmit={handleUpdateCoupon} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">รหัสคูปอง</label>
                        <input type="text" name="code" value={editingCoupon.code} onChange={handleEditChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-slate-600 cursor-not-allowed" disabled title="รหัสคูปองไม่สามารถแก้ไขได้" />
                        <p className="text-[10px] text-slate-400 mt-1">* รหัสคูปองไม่สามารถแก้ไขได้</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">ประเภท</label>
                            <select name="discount_type" value={editingCoupon.discount_type} onChange={handleEditChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 transition outline-none">
                                <option value="percentage">เปอร์เซ็นต์ (%)</option>
                                <option value="fixed">จำนวนเงิน (฿)</option>
                            </select>
                        </div>
                        <div className="w-1/2">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">มูลค่า</label>
                            <input type="number" name="discount_value" value={editingCoupon.discount_value} onChange={handleEditChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 transition outline-none text-center font-bold" min="0" />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">จำนวนสิทธิ์</label>
                            <input type="number" name="quantity" value={editingCoupon.quantity} onChange={handleEditChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 transition outline-none" min="1" />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">หมดอายุ</label>
                            <input type="date" name="expiry_date" value={editingCoupon.expiry_date} onChange={handleEditChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 transition outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">รายละเอียด</label>
                        <input type="text" name="description" value={editingCoupon.description} onChange={handleEditChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 transition outline-none" />
                    </div>

                    <div className="flex items-center gap-3 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <input type="checkbox" id="editActive" name="is_active" checked={editingCoupon.is_active} onChange={handleEditChange} className="accent-blue-600 size-4 cursor-pointer" />
                        <label htmlFor="editActive" className="cursor-pointer select-none text-slate-700 font-medium">เปิดใช้งานคูปอง</label>
                    </div>

                    <div className="flex gap-3 mt-4">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition">ยกเลิก</button>
                        <button type="submit" disabled={isUpdating} className="flex-1 py-3 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 shadow-lg shadow-yellow-100 transition flex justify-center items-center gap-2 disabled:opacity-70">
                            {isUpdating ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> บันทึกการแก้ไข</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && couponToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl max-w-sm w-full transform transition-all scale-100 animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 rounded-full mb-4 bg-red-100 text-red-600"><AlertTriangle size={32} /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">ยืนยันการลบคูปอง?</h3>
              <p className="text-slate-500 mb-6 text-sm md:text-base leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบคูปอง <span className="font-bold text-slate-800">"{couponToDelete.code}"</span>? <br/> การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition disabled:opacity-50">ยกเลิก</button>
                <button onClick={confirmDeleteCoupon} disabled={isDeleting} className="flex-1 px-4 py-2.5 text-white rounded-xl font-bold transition shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center bg-red-600 hover:bg-red-700 shadow-red-200">
                  {isDeleting ? <Loader2 size={20} className="animate-spin" /> : "ใช่, ลบเลย"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}