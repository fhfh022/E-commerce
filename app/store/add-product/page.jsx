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
    { label: "Asus", value: "asus" },
    { label: "Acer", value: "acer" },
    { label: "HP", value: "hp" },
    { label: "Lenovo", value: "lenovo" },
    { label: "MSI", value: "msi" },
    { label: "Gigabyte", value: "gigabyte" },
  ]
  /* ---------- State ---------- */
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null });
  const [productInfo, setProductInfo] = useState({
    name: "", brand: "", model: "", price: "", category: "",
  });
  const [specs, setSpecs] = useState({
    processor: "", graphics: "", ram: "", storage: "", display: "", ports: "",
    wireless: "", bluetooth: "", network: "", battery: "", os: "", weight: "",
  });

  /* ---------- Handlers ---------- */
  const onChangeProduct = (e) => setProductInfo({ ...productInfo, [e.target.name]: e.target.value });
  const onChangeSpecs = (e) => setSpecs({ ...specs, [e.target.name]: e.target.value });

  // CSS Constant สำหรับ Input (แก้ปัญหาเรื่องขอบไม่ชัด)
  const inputClass = "w-full border border-slate-300 p-2.5 rounded-md bg-white text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none shadow-sm";

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
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

      const imageUrls = [];
      for (const key of Object.keys(images)) {
        const file = images[key];
        if (!file) continue;
        const filePath = `${product.id}/${key}.png`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
        imageUrls.push(data.publicUrl);
      }

      const { error: updateError } = await supabase.from("products").update({ images: imageUrls }).eq("id", product.id);
      if (updateError) throw updateError;

      toast.success("Product added successfully");

      setProductInfo({
        name: "",
        brand: "",
        model: "",
        price: "",
        category: "",
      });

      setSpecs({
        processor: "",
        graphics: "",
        ram: "",
        storage: "",
        display: "",
        ports: "",
        wireless: "",
        bluetooth: "",
        network: "",
        battery: "",
        os: "",
        weight: "",
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
    <div className="max-w-4xl mx-auto py-10 px-4">
      <form onSubmit={onSubmitHandler} className="space-y-8">
        <header className="border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-bold text-slate-800">Add New Notebook</h1>
          <p className="text-slate-500 text-sm">Fill in the details below to list a new product.</p>
        </header>

        {/* --- Images --- */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Product Images</h2>
          <div className="flex flex-wrap gap-4">
            {Object.keys(images).map((key) => (
              <label key={key} className="relative w-28 h-28 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg bg-white hover:bg-blue-50 hover:border-blue-400 cursor-pointer transition-all">
                <Image
                  src={images[key] ? URL.createObjectURL(images[key]) : assets.upload_area}
                  alt="" fill className="object-contain p-2"
                />
                <input type="file" accept="image/*" hidden onChange={(e) => setImages({ ...images, [key]: e.target.files[0] })} />
              </label>
            ))}
          </div>
        </div>

        {/* --- General Info --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="md:col-span-2">
             <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-2">Basic Info</h2>
          </div>
          
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Product Name</span>
            <input type="text" name="name" value={productInfo.name} onChange={onChangeProduct} className={inputClass}  required />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Brand</span>
            <select value={productInfo.brand} onChange={(e) => setProductInfo({ ...productInfo, brand: e.target.value })} className={inputClass} required>
              <option value="">Select Brand</option>
              {brand.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Model</span>
            <input type="text" name="model" value={productInfo.model} onChange={onChangeProduct} className={inputClass}  required />
          </div>


          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Category</span>
            <select value={productInfo.category} onChange={(e) => setProductInfo({ ...productInfo, category: e.target.value })} className={inputClass} required>
              <option value="">Select Category</option>
              {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Price (THB)</span>
            <input type="number" name="price" value={productInfo.price} onChange={onChangeProduct} className={inputClass} min={0} required />
          </div>
        </div>

        {/* --- Specs --- */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-6">Technical Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {Object.keys(specs).map((key) => (
              <div key={key} className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700 capitalize">{key}</span>
                <input type="text" name={key} value={specs[key]} onChange={onChangeSpecs} className={inputClass} placeholder={`Enter ${key}...`} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t pt-6">
          <button
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-10 rounded-lg shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}