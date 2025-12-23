"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Trash2Icon, TicketPercent } from "lucide-react"; // เปลี่ยน Icon ให้สื่อความหมาย
import { supabase } from "@/lib/supabase"; // [เพิ่ม] เรียกใช้ Supabase

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    description: "",
    discount: "",
    expiry_date: new Date().toISOString().split("T")[0], // เก็บเป็น string YYYY-MM-DD เพื่อใช้กับ input date
    is_active: true,
  });

  // 1. ดึงข้อมูลคูปองจาก Supabase
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
      toast.error("Failed to load coupons");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. เพิ่มคูปองใหม่
  const handleAddCoupon = async (e) => {
    e.preventDefault();

    try {
      // เตรียมข้อมูลให้ตรงกับ Schema Database
      const couponData = {
        code: newCoupon.code.toUpperCase(), // แปลงเป็นตัวพิมพ์ใหญ่เสมอ
        description: newCoupon.description,
        discount_percent: parseInt(newCoupon.discount), // แปลงเป็นตัวเลข
        expiry_date: newCoupon.expiry_date,
        is_active: newCoupon.is_active,
      };

      const { data, error } = await supabase
        .from("coupons")
        .insert(couponData)
        .select()
        .single();

      if (error) {
        if (error.code === "23505")
          throw new Error("Coupon code already exists!"); // ดักจับ Error รหัสซ้ำ
        throw error;
      }

      setCoupons([data, ...coupons]); // อัปเดต State ทันที
      toast.success("Coupon added successfully");

      // Reset Form
      setNewCoupon({
        code: "",
        description: "",
        discount: "",
        expiry_date: new Date().toISOString().split("T")[0],
        is_active: true,
      });
    } catch (error) {
      console.error("Add error:", error);
      toast.error(error.message || "Failed to add coupon");
    }
  };

  const handleChange = (e) => {
    setNewCoupon({ ...newCoupon, [e.target.name]: e.target.value });
  };

  // 3. ลบคูปอง
  const deleteCoupon = async (id) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const { error } = await supabase.from("coupons").delete().eq("id", id);

      if (error) throw error;

      setCoupons(coupons.filter((c) => c.id !== id)); // ลบออกจาก State
      toast.success("Coupon deleted");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete coupon");
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  return (
    <div className="text-slate-500 mb-40 animate-in fade-in duration-500">
      {/* Add Coupon Form */}
      <div className="max-w-md bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
            <TicketPercent size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Add New Coupon</h2>
        </div>

        <form
          onSubmit={handleAddCoupon}
          className="flex flex-col gap-4 text-sm"
        >
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Code
              </label>
              <input
                type="text"
                placeholder="Example: SALE2024"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition font-medium uppercase"
                name="code"
                value={newCoupon.code}
                onChange={handleChange}
                required
              />
            </div>
            <div className="w-1/3">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Discount (%)
              </label>
              <input
                type="number"
                placeholder="%"
                min={1}
                max={100}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition text-center font-medium"
                name="discount"
                value={newCoupon.discount}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="Brief details about this discount"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition"
              name="description"
              value={newCoupon.description}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition text-slate-600"
              name="expiry_date"
              value={newCoupon.expiry_date}
              onChange={(e) =>
                setNewCoupon({ ...newCoupon, expiry_date: e.target.value })
              }
              required
            />
          </div>

          {/* Checkbox for Is Active */}
          <div className="flex items-center gap-3 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <input
              type="checkbox"
              id="isActive"
              checked={newCoupon.is_active}
              onChange={(e) =>
                setNewCoupon({ ...newCoupon, is_active: e.target.checked })
              }
              className="accent-blue-600 size-4 cursor-pointer"
            />
            <label
              htmlFor="isActive"
              className="cursor-pointer select-none text-slate-700 font-medium"
            >
              Active Coupon
            </label>
          </div>

          <button className="mt-2 w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition shadow-lg shadow-slate-200">
            Create Coupon
          </button>
        </form>
      </div>

      {/* List Coupons */}
      <div className="mt-12 max-w-4xl">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          Active Coupons{" "}
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
            {coupons.length}
          </span>
        </h2>

        {isLoading ? (
          <div className="text-center py-10">Loading coupons...</div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-4 px-6">Code</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6 text-center">Discount</th>
                  <th className="py-4 px-6">Expires</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="hover:bg-slate-50/50 transition"
                  >
                    <td className="py-4 px-6 font-bold text-slate-800 font-mono tracking-wide">
                      {coupon.code}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {coupon.description}
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-green-600">
                      {coupon.discount_percent}%
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {format(new Date(coupon.expiry_date), "dd MMM yyyy")}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          coupon.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {coupon.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => deleteCoupon(coupon.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Delete Coupon"
                      >
                        <Trash2Icon size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-10 text-slate-400"
                    >
                      No coupons available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
