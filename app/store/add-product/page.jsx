"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { assets } from "@/assets/assets";

export default function StoreAddProduct() {
  const categories = [
    { label: "Ultrabook", value: "ultrabook" },
    { label: "Gaming", value: "gaming" },
  ];

  const brand = [
    { label: "Asus", value: "Asus" },
    { label: "Acer", value: "Acer" },
    { label: "HP", value: "HP" },
    { label: "Lenovo", value: "Lenovo" },
    { label: "MSI", value: "MSI" },
    { label: "Gigabyte", value: "Gigabyte" },
    { label: "Dell", value: "Dell" },
  ];

  /* ---------- State ---------- */
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null });
  
  const [productInfo, setProductInfo] = useState({
    name: "", brand: "", model: "", price: "", category: ""
  });

  // Specs State
  const [specs, setSpecs] = useState({
    processor: "",        
    processor_detail: "", 
    graphics: "",         
    display: "",          
    display_size: "",     
    ram: "",              
    storage: "",          
    ports: "",            
    battery: "",          
    os: "",               
    bluetooth: "",        
    weight: "",           
    network: ""           
  });

  /* ---------- Handlers ---------- */
  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setProductInfo((prev) => ({ ...prev, [name]: value }));
  };

  const onChangeSpecs = (e) => {
    const { name, value } = e.target;
    setSpecs((prev) => ({ ...prev, [name]: value }));
  };

  const onImageChange = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      setImages((prev) => ({ ...prev, [key]: file }));
    }
  };

  /* ---------- Submit Form ---------- */
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Validation
      if (!productInfo.name || !productInfo.price || !productInfo.brand || !productInfo.category) {
        toast.error("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
        setLoading(false);
        return;
      }
      if (!images[1]) {
        toast.error("กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป");
        setLoading(false);
        return;
      }

      // 2. Upload Images
      let imageUrls = [];
      for (let i = 1; i <= 4; i++) {
        if (images[i]) {
          const file = images[i];
          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}_${i}.${fileExt}`;
          const filePath = `products/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from("product-images")
            .getPublicUrl(filePath);

          imageUrls.push(data.publicUrl);
        }
      }

      // 3. Insert Product
      const { error } = await supabase.from("products").insert({
        name: productInfo.name,
        brand: productInfo.brand,
        model: productInfo.model,
        price: Number(productInfo.price),
        category: productInfo.category,
        description: productInfo.description,
        images: imageUrls,
        date: Date.now(),
        specs: {
            processor: specs.processor,
            processor_detail: specs.processor_detail,
            graphics: specs.graphics,
            display: specs.display,
            display_size: specs.display_size,
            ram: specs.ram,
            storage: specs.storage,
            ports: specs.ports,
            battery: specs.battery,
            os: specs.os,
            bluetooth: specs.bluetooth,
            weight: specs.weight,
            network: specs.network
        }
      });

      if (error) throw error;

      toast.success("เพิ่มสินค้าเรียบร้อยแล้ว");
      
      // Reset Form
      setProductInfo({ name: "", brand: "", model: "", price: "", category: ""});
      setSpecs({
        processor: "", processor_detail: "", graphics: "", display: "", display_size: "",
        ram: "", storage: "", ports: "", battery: "", os: "", bluetooth: "", weight: "", network: ""
      });
      setImages({ 1: null, 2: null, 3: null, 4: null });

    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการเพิ่มสินค้า");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Styles ---------- */
  const inputClass = "w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all text-sm";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1";

  return (
    <form onSubmit={onSubmitHandler} className="max-w-4xl mx-auto pb-20">
      
        {/* Header */}
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">เพิ่มสินค้าใหม่</h1>
            <p className="text-slate-500 text-sm">กรอกรายละเอียดสินค้าของคุณเพื่อเริ่มวางจำหน่าย</p>
        </div>

        {/* 1. Basic Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">ข้อมูลทั่วไป</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
                <label className={labelClass}>ชื่อสินค้า <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={productInfo.name} onChange={onChangeHandler} className={inputClass} placeholder="ระบุชื่อสินค้า" required />
            </div>
            <div>
                <label className={labelClass}>แบรนด์ <span className="text-red-500">*</span></label>
                <select name="brand" onChange={onChangeHandler} value={productInfo.brand} className={inputClass} required>
                    <option value="">เลือกแบรนด์</option>
                    {brand.map((b, i) => <option key={i} value={b.value}>{b.label}</option>)}
                </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div>
                <label className={labelClass}>รุ่น (Model)</label>
                <input type="text" name="model" value={productInfo.model} onChange={onChangeHandler} className={inputClass} placeholder="ระบุรุ่นสินค้า" />
            </div>
            <div>
                <label className={labelClass}>ราคา (บาท) <span className="text-red-500">*</span></label>
                <input type="number" name="price" value={productInfo.price} onChange={onChangeHandler} className={inputClass} placeholder="เช่น 29990" required />
            </div>
            <div>
                <label className={labelClass}>หมวดหมู่ <span className="text-red-500">*</span></label>
                <select name="category" onChange={onChangeHandler} value={productInfo.category} className={inputClass} required>
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.map((c, i) => <option key={i} value={c.value}>{c.label}</option>)}
                </select>
            </div>
          </div>

        </div>

        {/* 2. Images */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
           <h3 className="text-lg font-bold text-slate-800 mb-1">รูปภาพสินค้า</h3>
           <p className="text-slate-400 text-xs mb-4">อัปโหลดสูงสุด 4 รูป (รูปแรกจะเป็นรูปหลัก)</p>

           <div className="flex gap-4 overflow-x-auto pb-2">
             {[1, 2, 3, 4].map((num) => (
                <label key={num} htmlFor={`image${num}`} className="flex-shrink-0 cursor-pointer group relative">
                    <div className={`w-32 h-32 rounded-xl border-2 border-dashed flex items-center justify-center bg-slate-50 transition-all ${images[num] ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-slate-400'}`}>
                        {images[num] ? (
                            <Image src={URL.createObjectURL(images[num])} alt="" width={100} height={100} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <div className="text-center p-2">
                                <Image src={assets.upload_area} alt="" width={24} height={24} className="mx-auto opacity-50 mb-1" />
                                <span className="text-xs text-slate-400 font-medium">Upload</span>
                            </div>
                        )}
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                    </div>
                    <input type="file" id={`image${num}`} hidden onChange={(e) => onImageChange(e, num)} />
                </label>
             ))}
           </div>
        </div>

        {/* 3. Technical Specs */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">ข้อมูลจำเพาะ (Specs)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div>
                <label className={labelClass}>หน่วยประมวลผล (CPU)</label>
                <input type="text" name="processor" value={specs.processor} onChange={onChangeSpecs} className={inputClass} placeholder="เช่น Intel Core i9-14900HX" />
            </div>
            <div>
                <label className={labelClass}>รายละเอียด CPU</label>
                <input type="text" name="processor_detail" value={specs.processor_detail} onChange={onChangeSpecs} className={inputClass} placeholder="เช่น 2.2GHz up to 5.8GHz" />
            </div>

            <div>
                <label className={labelClass}>กราฟิก (GPU)</label>
                <input type="text" name="graphics" value={specs.graphics} onChange={onChangeSpecs} className={inputClass} placeholder="เช่น NVIDIA GeForce RTX 4060" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>หน้าจอ (Display)</label>
                    <input type="text" name="display" value={specs.display} onChange={onChangeSpecs} className={inputClass} placeholder="เช่น IPS 165Hz" />
                </div>
                <div>
                    <label className={labelClass}>ขนาดหน้าจอ</label>
                    <input type="text" name="display_size" value={specs.display_size} onChange={onChangeSpecs} className={inputClass} placeholder='เช่น 16.0"' />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>หน่วยความจำ (RAM)</label>
                    <input type="text" name="ram" value={specs.ram} onChange={onChangeSpecs} className={inputClass} placeholder="เช่น 32GB DDR5" />
                </div>
                <div>
                    <label className={labelClass}>พื้นที่เก็บข้อมูล (Storage)</label>
                    <input type="text" name="storage" value={specs.storage} onChange={onChangeSpecs} className={inputClass} placeholder="เช่น 1TB SSD M.2" />
                </div>
            </div>

            <div>
                <label className={labelClass}>พอร์ตเชื่อมต่อ</label>
                <input type="text" name="ports" value={specs.ports} onChange={onChangeSpecs} className={inputClass} placeholder="เช่น 2x USB 3.2, 1x HDMI" />
            </div>
            <div>
                <label className={labelClass}>แบตเตอรี่</label>
                <input type="text" name="battery" value={specs.battery} onChange={onChangeSpecs} className={inputClass} placeholder="เช่น 4-Cell, 90Wh" />
            </div>

            <div>
                <label className={labelClass}>ระบบปฏิบัติการ (OS)</label>
                <input type="text" name="os" value={specs.os} onChange={onChangeSpecs} className={inputClass} placeholder="เช่น Windows 11 Home" />
            </div>
            <div>
                <label className={labelClass}>บลูทูธ</label>
                <input type="text" name="bluetooth" value={specs.bluetooth} onChange={onChangeSpecs} className={inputClass} />
            </div>

            <div>
                <label className={labelClass}>น้ำหนัก</label>
                <input type="text" name="weight" value={specs.weight} onChange={onChangeSpecs} className={inputClass} placeholder="เช่น 2.50 KG" />
            </div>
            <div>
                <label className={labelClass}>เครือข่าย (LAN/WiFi)</label>
                <input type="text" name="network" value={specs.network} onChange={onChangeSpecs} className={inputClass} placeholder="เช่น Wi-Fi 6E, Gigabit LAN" />
            </div>

          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end border-t pt-6 sticky bottom-0 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-100 shadow-2xl z-10">
          <button
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-12 rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
                <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    กำลังบันทึก...
                </>
            ) : (
                "บันทึกสินค้า"
            )}
          </button>
          
        </div>

    </form>
  );
}