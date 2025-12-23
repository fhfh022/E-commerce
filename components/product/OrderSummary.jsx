"use client";
import { PlusIcon, Edit2Icon, Trash2Icon, AlertTriangle } from "lucide-react"; // เพิ่ม AlertTriangle
import React, { useState, useEffect } from "react";
import AddressModal from "./AddressModal";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  setAddresses,
  deleteAddress,
} from "@/lib/features/address/addressSlice";

const OrderSummary = ({ totalPrice, items }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";

  const addressList = useSelector((state) => state.address.list);
  const user = useSelector((state) => state.auth.user);

  const [paymentMethod, setPaymentMethod] = useState("STRIPE");
  const [selectedAddressIndex, setSelectedAddressIndex] = useState("");

  // Modals State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState(null);

  // ✅ เพิ่ม State สำหรับ Modal ลบ
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressIdToDelete, setAddressIdToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Coupon States
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [coupon, setCoupon] = useState("");

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) return;
      try {
        const userId = user.id;
        if (userId) {
          const { data: addresses } = await supabase
            .from("addresses")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

          if (addresses) dispatch(setAddresses(addresses));
        }
      } catch (error) {
        console.error("Fetch Address Error:", error);
      }
    };
    if (addressList.length === 0) fetchAddresses();
  }, [user, dispatch, addressList.length]);

  const handleEditAddress = (address) => {
    setAddressToEdit(address);
    setShowAddressModal(true);
  };

  // ✅ ฟังก์ชันเปิด Modal ลบ
  const requestDeleteAddress = (addressId) => {
    setAddressIdToDelete(addressId);
    setShowDeleteModal(true);
  };

  // ✅ ฟังก์ชันยืนยันการลบ
  const confirmDeleteAddress = async () => {
    if (!addressIdToDelete) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", addressIdToDelete);
      if (error) throw error;

      dispatch(deleteAddress(addressIdToDelete));

      // ถ้าลบตัวที่เลือกอยู่ ให้ Reset การเลือก
      if (addressList[selectedAddressIndex]?.id === addressIdToDelete) {
        setSelectedAddressIndex("");
      }

      toast.success("Address deleted successfully");
      setShowDeleteModal(false);
    } catch (error) {
      toast.error("Failed to delete address");
    } finally {
      setIsDeleting(false);
      setAddressIdToDelete(null);
    }
  };

  const discountAmount = coupon ? (coupon.discount / 100) * totalPrice : 0;
  const finalTotal = totalPrice - discountAmount;

  const handleCouponCode = async (event) => {
    event.preventDefault();
    if (!couponCodeInput) return;

    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCodeInput.toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        toast.error("Invalid or expired coupon code");
        return;
      }

      // เช็ควันหมดอายุ (ถ้ามี)
      if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
        toast.error("This coupon has expired");
        return;
      }

      // บันทึกข้อมูลคูปองลง State
      setCoupon({
        code: data.code,
        discount: data.discount_percent,
        description: data.description,
      });

      toast.success(`Coupon Applied: ${data.discount_percent}% off!`);
      setCouponCodeInput(""); // ล้างช่อง Input
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (selectedAddressIndex === "" || selectedAddressIndex === null) {
      toast.error("Please select a shipping address");
      return;
    }
    toast.success("Order Placed Successfully!");
    router.push("/orders");
  };

  return (
    <div className="w-full max-w-lg lg:max-w-[340px] bg-white border border-slate-200 text-slate-500 text-sm rounded-2xl p-7 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Order Summary</h2>

      <div className="space-y-3 mb-6">
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
          Payment Method
        </p>
        <label
          className={`flex gap-3 items-center p-3 border rounded-xl cursor-not-allowed transition-all ${
            paymentMethod === "COD"
              ? "border-blue-500 bg-blue-50/50"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <input
            type="radio"
            name="payment"
            onChange={() => setPaymentMethod("COD")}
            checked={paymentMethod === "COD"}
            className="accent-blue-600 size-4 cursor-not-allowed"
            disabled
          />
          <span className="font-medium text-gray-700 opacity-50">
            Cash on Delivery (Not Available)
          </span>
        </label>
        <label
          className={`flex gap-3 items-center p-3 border rounded-xl cursor-pointer transition-all ${
            paymentMethod === "STRIPE"
              ? "border-blue-500 bg-blue-50/50"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <input
            type="radio"
            name="payment"
            onChange={() => setPaymentMethod("STRIPE")}
            checked={paymentMethod === "STRIPE"}
            className="accent-blue-600 size-4"
          />
          <span className="font-medium text-slate-700">Stripe Payment</span>
        </label>
      </div>

      <div className="my-6 py-6 border-y border-slate-100">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
          Shipping Address
        </p>

        {addressList.length > 0 ? (
          <div className="space-y-3">
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition text-slate-700 font-medium appearance-none cursor-pointer"
              onChange={(e) => setSelectedAddressIndex(e.target.value)}
              value={selectedAddressIndex}
            >
              <option value="" disabled>
                -- Select Delivery Address --
              </option>
              {addressList.map((addr, index) => (
                <option key={addr.id} value={index}>
                  {addr.receiver_name} - {addr.province}
                </option>
              ))}
            </select>

            {selectedAddressIndex !== "" &&
              addressList[selectedAddressIndex] && (
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed relative group animate-in fade-in slide-in-from-top-2">
                  <p>
                    <span className="font-bold">To:</span>{" "}
                    {addressList[selectedAddressIndex].receiver_name}
                  </p>
                  <p>
                    <span className="font-bold">Tel:</span>{" "}
                    {addressList[selectedAddressIndex].phone_number}
                  </p>
                  <p className="mt-1 mb-2 pr-10">
                    {addressList[selectedAddressIndex].detail},{" "}
                    {addressList[selectedAddressIndex].sub_district},{" "}
                    {addressList[selectedAddressIndex].province},{" "}
                    {addressList[selectedAddressIndex].postal_code}
                  </p>

                  <div className="flex gap-3 mt-2 border-t border-slate-200 pt-2">
                    <button
                      onClick={() =>
                        handleEditAddress(addressList[selectedAddressIndex])
                      }
                      className="flex items-center gap-1 text-slate-400 hover:text-blue-600 font-medium transition"
                    >
                      <Edit2Icon size={14} /> Edit
                    </button>
                    <button
                      onClick={() =>
                        requestDeleteAddress(
                          addressList[selectedAddressIndex].id
                        )
                      }
                      className="flex items-center gap-1 text-slate-400 hover:text-red-500 font-medium transition"
                    >
                      <Trash2Icon size={14} /> Delete
                    </button>
                  </div>
                </div>
              )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic mb-2">
            No address found. Please add one.
          </p>
        )}

        <button
          className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 border border-dashed border-slate-300 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition font-medium"
          onClick={() => {
            setAddressToEdit(null);
            setShowAddressModal(true);
          }}
        >
          <PlusIcon size={16} /> Add New Address
        </button>
      </div>

      {/* Cost Breakdown & Total ... */}
      <div className="space-y-3 pb-6 border-b border-slate-100">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal</span>
          <span className="font-medium text-slate-700">
            {currency}
            {totalPrice.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Shipping</span>
          <span className="text-green-600 font-medium">Free</span>
        </div>
        {coupon && (
          <div className="flex justify-between text-blue-600">
            <span>Coupon ({coupon.code})</span>
            <span>
              -{currency}
              {discountAmount.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {!coupon ? (
        <form onSubmit={handleCouponCode} className="flex gap-2 mt-6">
          <input
            onChange={(e) => setCouponCodeInput(e.target.value)}
            value={couponCodeInput}
            type="text"
            placeholder="Promo Code"
            className="flex-1 border border-slate-200 p-2.5 px-3 rounded-xl outline-none focus:border-blue-500 transition text-sm"
          />
          <button className="bg-slate-800 text-white px-4 rounded-xl hover:bg-slate-900 active:scale-95 transition-all font-medium">
            Apply
          </button>
        </form>
      ) : (
        <div className="mt-6 bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-blue-600">
              COUPON APPLIED
            </span>
            <span className="text-xs text-blue-400">{coupon.description}</span>
          </div>
          {/* ปุ่มลบ Coupon ถ้ามี */}
        </div>
      )}

      <div className="flex justify-between items-center py-6">
        <span className="font-bold text-slate-800 text-lg">Total</span>
        <span className="font-black text-slate-900 text-xl">
          {currency}
          {finalTotal.toLocaleString()}
        </span>
      </div>

      <button
        onClick={handlePlaceOrder}
        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200"
      >
        Place Order
      </button>

      {/* Modal: Add/Edit Address */}
      {showAddressModal && (
        <AddressModal
          setShowAddressModal={setShowAddressModal}
          addressToEdit={addressToEdit}
          setAddressToEdit={setAddressToEdit}
        />
      )}

      {/* ✅ Modal: Delete Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={36} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Delete Address?
              </h3>
              <p className="text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to remove this address? This action cannot
                be undone.
              </p>
              <div className="grid grid-cols-1 gap-3 w-full mt-8">
                <button
                  disabled={isDeleting}
                  onClick={confirmDeleteAddress}
                  className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-100 active:scale-95 disabled:opacity-70 transition-all"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete it"}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-3.5 bg-white text-slate-400 font-bold rounded-2xl hover:text-slate-600 active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSummary;
