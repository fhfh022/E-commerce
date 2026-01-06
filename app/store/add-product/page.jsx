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
    name: "", brand: "", model: "", price: "", category: "",
  });

  // ✅ แก้ไข: ปรับโครงสร้าง Specs ให้รองรับ Fields ใหม่ (Detail & Size)
  const [specs, setSpecs] = useState({
    processor: "",        // ชื่อรุ่น CPU เช่น Intel Core i9-14900HX
    processor_detail: "", // รายละเอียด เช่น 2.2GHz up to 5.8GHz, 36MB Cache
    graphics: "",         // การ์ดจอ
    display_size: "",     // ขนาดจอ เช่น 16.0"
    display_specs: "",    // สเปคจอ เช่น WQXGA (2560x1600), 240Hz, IPS
    ram: "",
    storage: "",
    os: "",
    wireless: "",
    bluetooth: "",
    ports: "",
    battery: "",
    weight: "",
    network: "", // LAN ถ้ามี
  });

  /* ---------- Handlers ---------- */
  const onChangeProduct = (e) => setProductInfo({ ...productInfo, [e.target.name]: e.target.value });
  const onChangeSpecs = (e) => setSpecs({ ...specs, [e.target.name]: e.target.value });

  // CSS Constant
  const inputClass = "w-full border border-slate-300 p-2.5 rounded-md bg-white text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none shadow-sm text-sm";
  const labelClass = "text-sm font-medium text-slate-700 mb-1.5 block";

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    // ✅ CONFIG: เปลี่ยนชื่อ Bucket ที่ต้องการใช้ตรงนี้ครับ
    // ถ้าอันเก่าเต็ม ก็สร้างอันใหม่ใน Supabase แล้วมาเปลี่ยนชื่อตรงนี้เป็น 'product-images-2' ได้เลย
    const CURRENT_BUCKET = "product-images"; 

    try {
      // 1. Insert Product Data (เหมือนเดิม)
      const { data: product, error: insertError } = await supabase
        .from("products")
        .insert({
          name: productInfo.name,
          brand: productInfo.brand,
          model: productInfo.model,
          price: Number(productInfo.price),
          category: productInfo.category,
          specs: specs,
        })
        .select().single();

      if (insertError) throw insertError;

      // 2. Upload Images (แก้ไขให้ใช้ตัวแปร CURRENT_BUCKET)
      const imageUrls = [];
      for (const key of Object.keys(images)) {
        const file = images[key];
        if (!file) continue;
        
        const filePath = `${product.id}/${key}.png`;
        
        // ✅ Upload ไปยัง Bucket ที่กำหนด
        const { error: uploadError } = await supabase.storage
            .from(CURRENT_BUCKET) 
            .upload(filePath, file, { upsert: true });
            
        if (uploadError) throw uploadError;
        
        // ✅ Get URL จาก Bucket เดียวกัน
        const { data } = supabase.storage
            .from(CURRENT_BUCKET)
            .getPublicUrl(filePath);
            
        imageUrls.push(data.publicUrl);
      }

      // 3. Update Product with Image URLs (เหมือนเดิม)
      const { error: updateError } = await supabase.from("products").update({ images: imageUrls }).eq("id", product.id);
      if (updateError) throw updateError;

      toast.success("Product added successfully");

      // 4. Reset Form (เหมือนเดิม)
      setProductInfo({
        name: "", brand: "", model: "", price: "", category: "",
      });

      setSpecs({
        processor: "", processor_detail: "",
        graphics: "",
        display_size: "", display_specs: "",
        ram: "", storage: "",
        os: "", wireless: "", bluetooth: "",
        ports: "", battery: "", weight: "", network: ""
      });

      setImages({ 1: null, 2: null, 3: null, 4: null });

    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-20">
      <form onSubmit={onSubmitHandler} className="space-y-8">
        <header className="border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-bold text-slate-800">Add New Notebook</h1>
          <p className="text-slate-500 text-sm">Fill in the details below to list a new product.</p>
        </header>

        {/* --- Images Section --- */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Product Images</h2>
          <div className="flex flex-wrap gap-4">
            {Object.keys(images).map((key) => (
              <label key={key} className="relative w-28 h-28 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg bg-white hover:bg-blue-50 hover:border-blue-400 cursor-pointer transition-all group overflow-hidden">
                <Image
                  src={images[key] ? URL.createObjectURL(images[key]) : assets.upload_area || "/placeholder.png"}
                  alt="" fill className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                />
                <input type="file" accept="image/*" hidden onChange={(e) => setImages({ ...images, [key]: e.target.files[0] })} />
                {!images[key] && <span className="text-xs text-slate-400 mt-2">Image {key}</span>}
              </label>
            ))}
          </div>
        </div>

        {/* --- General Info Section --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="md:col-span-2 border-b border-slate-100 pb-2 mb-2">
             <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Basic Info</h2>
          </div>
          
          <div className="md:col-span-2">
            <label className={labelClass}>Product Name (Full Name)</label>
            <input type="text" name="name" value={productInfo.name} onChange={onChangeProduct} className={inputClass} required />
          </div>

          <div>
            <label className={labelClass}>Brand</label>
            <select value={productInfo.brand} onChange={(e) => setProductInfo({ ...productInfo, brand: e.target.value })} className={inputClass} required>
              <option value="">Select Brand</option>
              {brand.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Model Code</label>
            <input type="text" name="model" value={productInfo.model} onChange={onChangeProduct} className={inputClass} required />
          </div>

          <div>
            <label className={labelClass}>Category</label>
            <select value={productInfo.category} onChange={(e) => setProductInfo({ ...productInfo, category: e.target.value })} className={inputClass} required>
              <option value="">Select Category</option>
              {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Price (THB)</label>
            <input type="number" name="price" value={productInfo.price} onChange={onChangeProduct} className={inputClass} min={0} required />
          </div>
        </div>

        {/* --- Specs Section (Custom Layout) --- */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="border-b border-slate-100 pb-2 mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Technical Specifications</h2>
            <p className="text-xs text-slate-400 mt-1">Separate details carefully for better display card formatting.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* CPU Section - แยก Model กับ Detail */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="md:col-span-1">
                    <label className={labelClass}>CPU Model <span className="text-red-500">*</span></label>
                    <input type="text" name="processor" value={specs.processor} onChange={onChangeSpecs} className={inputClass} required />
                </div>
                <div className="md:col-span-2">
                    <label className={labelClass}>CPU Detail (Speed/Cache)</label>
                    <input type="text" name="processor_detail" value={specs.processor_detail} onChange={onChangeSpecs} className={inputClass} />
                </div>
            </div>

            {/* Graphics */}
            <div className="md:col-span-2">
               <label className={labelClass}>Graphics Card <span className="text-red-500">*</span></label>
               <input type="text" name="graphics" value={specs.graphics} onChange={onChangeSpecs} className={inputClass} required />
            </div>

            {/* Display Section - แยก Size กับ Specs */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="md:col-span-1">
                    <label className={labelClass}>Display Size <span className="text-red-500">*</span></label>
                    <input type="text" name="display_size" value={specs.display_size} onChange={onChangeSpecs} className={inputClass} required />
                </div>
                <div className="md:col-span-2">
                    <label className={labelClass}>Display Specs (Res/Panel/Hz)</label>
                    <input type="text" name="display_specs" value={specs.display_specs} onChange={onChangeSpecs} className={inputClass} />
                </div>
            </div>

            {/* Memory & Storage */}
            <div>
                <label className={labelClass}>RAM</label>
                <input type="text" name="ram" value={specs.ram} onChange={onChangeSpecs} className={inputClass} />
            </div>
            <div>
                <label className={labelClass}>Storage</label>
                <input type="text" name="storage" value={specs.storage} onChange={onChangeSpecs} className={inputClass} />
            </div>

            {/* OS & Battery */}
            <div>
                <label className={labelClass}>Operating System</label>
                <input type="text" name="os" value={specs.os} onChange={onChangeSpecs} className={inputClass} />
            </div>
            <div>
                <label className={labelClass}>Battery</label>
                <input type="text" name="battery" value={specs.battery} onChange={onChangeSpecs} className={inputClass} />
            </div>

            {/* Connectivity */}
            <div className="md:col-span-2">
                <label className={labelClass}>Ports</label>
                <input type="text" name="ports" value={specs.ports} onChange={onChangeSpecs} className={inputClass} />
            </div>
            
            <div>
                <label className={labelClass}>Wireless</label>
                <input type="text" name="wireless" value={specs.wireless} onChange={onChangeSpecs} className={inputClass} />
            </div>
             <div>
                <label className={labelClass}>Bluetooth</label>
                <input type="text" name="bluetooth" value={specs.bluetooth} onChange={onChangeSpecs} className={inputClass} />
            </div>

            <div>
                <label className={labelClass}>Weight</label>
                <input type="text" name="weight" value={specs.weight} onChange={onChangeSpecs} className={inputClass} placeholder="e.g. 2.50 KG" />
            </div>
            <div>
                <label className={labelClass}>Network (LAN)</label>
                <input type="text" name="network" value={specs.network} onChange={onChangeSpecs} className={inputClass} placeholder="e.g. 10/100/1000 LAN" />
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
                    Saving Product...
                </>
            ) : (
                "Save Product"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}