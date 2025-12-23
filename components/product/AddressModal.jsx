'use client'
import { XIcon } from "lucide-react"
import { useState, useEffect } from "react" // เพิ่ม useEffect
import { toast } from "react-hot-toast"
import { supabase } from "@/lib/supabase"
import { useDispatch, useSelector } from "react-redux"
import { addAddress, updateAddress } from "@/lib/features/address/addressSlice" // เพิ่ม updateAddress

const AddressModal = ({ setShowAddressModal, addressToEdit, setAddressToEdit }) => {
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);

    // Initial State ว่างเปล่า
    const [address, setAddress] = useState({
        name: '',
        phone: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'Thailand'
    })

    // ✅ ใช้ useEffect เพื่อ Pre-fill ข้อมูลถ้าเป็นการ Edit
    useEffect(() => {
        if (addressToEdit) {
            setAddress({
                name: addressToEdit.receiver_name,
                phone: addressToEdit.phone_number,
                street: addressToEdit.detail,
                city: addressToEdit.sub_district,
                state: addressToEdit.province,
                zip: addressToEdit.postal_code,
                country: 'Thailand',
                email: '' // ใน DB ไม่ได้เก็บ email ไว้
            });
        }
    }, [addressToEdit]);

    const handleAddressChange = (e) => {
        setAddress({ ...address, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user || !user.id) {
            toast.error("Please login first");
            return;
        }

        try {
            const addressData = {
                user_id: user.id,
                receiver_name: address.name,
                phone_number: address.phone,
                detail: address.street,
                sub_district: address.city,
                district: address.city,
                province: address.state,
                postal_code: address.zip,
                is_default: false
            };

            if (addressToEdit) {
                // 🟡 Logic แก้ไข (Update)
                const { data, error } = await supabase
                    .from('addresses')
                    .update(addressData)
                    .eq('id', addressToEdit.id)
                    .select()
                    .single();

                if (error) throw error;
                dispatch(updateAddress(data));
                toast.success("Address updated!");
            } else {
                // 🟢 Logic เพิ่มใหม่ (Insert)
                const { data, error } = await supabase
                    .from('addresses')
                    .insert(addressData)
                    .select()
                    .single();

                if (error) throw error;
                dispatch(addAddress(data));
                toast.success("Address added!");
            }

            handleClose(); // ปิด Modal

        } catch (error) {
            console.error("Address Error:", error);
            toast.error(error.message);
        }
    }

    // ฟังก์ชันปิด Modal และ Reset ค่า
    const handleClose = () => {
        setShowAddressModal(false);
        if (setAddressToEdit) setAddressToEdit(null); // Reset ตัวที่กำลัง Edit
    }

    return (
        <form onSubmit={handleSubmit} className="fixed inset-0 z-50 bg-white/60 backdrop-blur h-screen flex items-center justify-center animate-in fade-in duration-200">
            <div className="flex flex-col gap-4 text-slate-700 w-full max-w-md mx-6 bg-white p-8 rounded-2xl shadow-2xl border border-slate-100 relative">
                <h2 className="text-2xl font-bold text-slate-800">
                    {addressToEdit ? "Edit Address" : "Add New Address"}
                </h2>
                
                {/* ... (Input Fields เหมือนเดิมเป๊ะ ไม่ต้องแก้) ... */}
                <div className="grid grid-cols-2 gap-3">
                    <input name="name" onChange={handleAddressChange} value={address.name} className="p-2.5 px-4 outline-none border border-slate-200 rounded-lg w-full focus:border-blue-500 transition" type="text" placeholder="Receiver Name" required />
                    <input name="phone" onChange={handleAddressChange} value={address.phone} className="p-2.5 px-4 outline-none border border-slate-200 rounded-lg w-full focus:border-blue-500 transition" type="text" placeholder="Phone Number" required />
                </div>

                <input name="email" onChange={handleAddressChange} value={address.email} className="p-2.5 px-4 outline-none border border-slate-200 rounded-lg w-full focus:border-blue-500 transition" type="email" placeholder="Email (Optional)" />
                <input name="street" onChange={handleAddressChange} value={address.street} className="p-2.5 px-4 outline-none border border-slate-200 rounded-lg w-full focus:border-blue-500 transition" type="text" placeholder="House No., Street, Soi" required />
                
                <div className="grid grid-cols-2 gap-3">
                    <input name="city" onChange={handleAddressChange} value={address.city} className="p-2.5 px-4 outline-none border border-slate-200 rounded-lg w-full focus:border-blue-500 transition" type="text" placeholder="District / City" required />
                    <input name="state" onChange={handleAddressChange} value={address.state} className="p-2.5 px-4 outline-none border border-slate-200 rounded-lg w-full focus:border-blue-500 transition" type="text" placeholder="Province / State" required />
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                    <input name="zip" onChange={handleAddressChange} value={address.zip} className="p-2.5 px-4 outline-none border border-slate-200 rounded-lg w-full focus:border-blue-500 transition" type="text" placeholder="Postal Code" required />
                    
                </div>

                <div>
                    <input name="country" onChange={handleAddressChange} value={address.country} className="p-2.5 px-4 outline-none border border-slate-200 rounded-lg w-full bg-slate-50 text-slate-500" type="text" placeholder="Country" readOnly hidden/>
                </div>

                <button type="submit" className="bg-slate-900 text-white text-sm font-bold py-3.5 rounded-xl hover:bg-slate-800 active:scale-95 transition-all mt-2 shadow-lg shadow-slate-200">
                    {addressToEdit ? "UPDATE ADDRESS" : "SAVE ADDRESS"}
                </button>
                
                {/* ปุ่มปิด */}
                <button type="button" onClick={handleClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition">
                    <XIcon size={24} />
                </button>
            </div>
        </form>
    )
}

export default AddressModal