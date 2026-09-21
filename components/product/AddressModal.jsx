'use client'
import { XIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { supabase } from "@/lib/supabase"
import { useDispatch, useSelector } from "react-redux"
import { addAddress, updateAddress } from "@/lib/features/address/addressSlice"
import { getProvinces, getDistricts, getSubDistricts, getZipCode } from "@/lib/data/thaiLocations"

const AddressModal = ({ setShowAddressModal, addressToEdit, setAddressToEdit }) => {
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);

    const [address, setAddress] = useState({
        name: '',
        phone: '',
        email: '',
        street: '',
        province: '',
        district: '',
        sub_district: '',
        zip: '',
        country: 'Thailand'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pre-fill ข้อมูลเดิมเมื่อเป็นการแก้ไข (Edit)
    useEffect(() => {
        if (addressToEdit) {
            setAddress({
                name: addressToEdit.receiver_name || '',
                phone: addressToEdit.phone_number || '',
                email: '',
                street: addressToEdit.detail || '',
                sub_district: addressToEdit.sub_district || '',
                district: addressToEdit.district || '',
                province: addressToEdit.province || '',
                zip: addressToEdit.postal_code || '',
                country: 'Thailand'
            });
        }
    }, [addressToEdit]);

    // ตัวเลือกพื้นที่ Dynamic
    const provincesList = getProvinces();
    const districtsList = getDistricts(address.province);
    const subDistrictsList = getSubDistricts(address.province, address.district);

    const handleProvinceChange = (e) => {
        const selectedProvince = e.target.value;
        setAddress((prev) => ({
            ...prev,
            province: selectedProvince,
            district: '',
            sub_district: '',
            zip: ''
        }));
    };

    const handleDistrictChange = (e) => {
        const selectedDistrict = e.target.value;
        setAddress((prev) => ({
            ...prev,
            district: selectedDistrict,
            sub_district: '',
            zip: ''
        }));
    };

    const handleSubDistrictChange = (e) => {
        const selectedSubDistrict = e.target.value;
        const autoZip = getZipCode(address.province, address.district, selectedSubDistrict);
        setAddress((prev) => ({
            ...prev,
            sub_district: selectedSubDistrict,
            zip: autoZip || prev.zip
        }));
    };

    const handleAddressChange = (e) => {
        setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user || !user.id) {
            toast.error("กรุณาเข้าสู่ระบบก่อน");
            return;
        }

        if (!address.province || !address.district || !address.sub_district) {
            toast.error("กรุณาเลือกจังหวัด อำเภอ และตำบลให้ครบถ้วน");
            return;
        }

        setIsSubmitting(true);

        try {
            const addressData = {
                user_id: user.id,
                receiver_name: address.name,
                phone_number: address.phone,
                detail: address.street,
                sub_district: address.sub_district,
                district: address.district,
                province: address.province,
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
                toast.success("อัปเดตที่อยู่เรียบร้อยแล้ว!");
            } else {
                // 🟢 Logic เพิ่มใหม่ (Insert)
                const { data, error } = await supabase
                    .from('addresses')
                    .insert(addressData)
                    .select()
                    .single();

                if (error) throw error;
                dispatch(addAddress(data));
                toast.success("เพิ่มที่อยู่เรียบร้อยแล้ว!");
            }

            handleClose();

        } catch (error) {
            console.error("Address Error:", error);
            toast.error(error.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setShowAddressModal(false);
        if (setAddressToEdit) setAddressToEdit(null);
    };

    return (
        <form onSubmit={handleSubmit} className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm h-screen flex items-center justify-center animate-in fade-in duration-200">
            <div className="flex flex-col gap-4 text-slate-700 w-full max-w-md mx-6 bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-slate-800">
                    {addressToEdit ? "แก้ไขที่อยู่" : "เพิ่มที่อยู่ใหม่"}
                </h2>

                <div className="grid grid-cols-2 gap-3">
                    <input
                        name="name"
                        onChange={handleAddressChange}
                        value={address.name}
                        className="p-2.5 px-4 outline-none border border-slate-200 rounded-lg w-full focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
                        type="text"
                        placeholder="ชื่อ-นามสกุล ผู้รับ"
                        required
                    />
                    <input
                        name="phone"
                        onChange={handleAddressChange}
                        value={address.phone}
                        className="p-2.5 px-4 outline-none border border-slate-200 rounded-lg w-full focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
                        type="text"
                        placeholder="เบอร์โทรศัพท์"
                        required
                    />
                </div>

                <input
                    name="email"
                    onChange={handleAddressChange}
                    value={address.email}
                    className="p-2.5 px-4 outline-none border border-slate-200 rounded-lg w-full focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
                    type="email"
                    placeholder="อีเมล (ไม่บังคับ)"
                />

                <input
                    name="street"
                    onChange={handleAddressChange}
                    value={address.street}
                    className="p-2.5 px-4 outline-none border border-slate-200 rounded-lg w-full focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
                    type="text"
                    placeholder="บ้านเลขที่, ซอย, ถนน, อาคาร"
                    required
                />

                {/* เลือกจังหวัด */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">จังหวัด</label>
                    <select
                        name="province"
                        value={address.province}
                        onChange={handleProvinceChange}
                        className="p-2.5 px-4 outline-none border border-slate-200 rounded-lg w-full focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm bg-white text-slate-700 cursor-pointer"
                        required
                    >
                        <option value="">-- เลือกจังหวัด --</option>
                        {provincesList.map((prov) => (
                            <option key={prov} value={prov}>
                                {prov}
                            </option>
                        ))}
                    </select>
                </div>

                {/* เลือกอำเภอ / เขต */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">อำเภอ / เขต</label>
                    <select
                        name="district"
                        value={address.district}
                        onChange={handleDistrictChange}
                        disabled={!address.province}
                        className="p-2.5 px-4 outline-none border border-slate-200 rounded-lg w-full focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm bg-white text-slate-700 cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                        required
                    >
                        <option value="">-- เลือกอำเภอ / เขต --</option>
                        {districtsList.map((dist) => (
                            <option key={dist} value={dist}>
                                {dist}
                            </option>
                        ))}
                    </select>
                </div>

                {/* เลือกตำบล / แขวง & รหัสไปรษณีย์ */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">ตำบล / แขวง</label>
                        <select
                            name="sub_district"
                            value={address.sub_district}
                            onChange={handleSubDistrictChange}
                            disabled={!address.district}
                            className="p-2.5 px-4 outline-none border border-slate-200 rounded-lg w-full focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm bg-white text-slate-700 cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                            required
                        >
                            <option value="">-- เลือกตำบล / แขวง --</option>
                            {subDistrictsList.map((sub) => (
                                <option key={sub.name} value={sub.name}>
                                    {sub.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">รหัสไปรษณีย์</label>
                        <input
                            name="zip"
                            onChange={handleAddressChange}
                            value={address.zip}
                            className="p-2.5 px-4 outline-none border border-slate-200 rounded-lg w-full focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm"
                            type="text"
                            placeholder="รหัสไปรษณีย์"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-slate-900 text-white text-sm font-bold py-3.5 rounded-xl hover:bg-slate-800 active:scale-95 transition-all mt-2 shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "กำลังบันทึก..." : addressToEdit ? "บันทึกการแก้ไข" : "บันทึกที่อยู่"}
                </button>

                {/* ปุ่มปิด */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition"
                    aria-label="ปิด"
                >
                    <XIcon size={24} />
                </button>
            </div>
        </form>
    )
}

export default AddressModal