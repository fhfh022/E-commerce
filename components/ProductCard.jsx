'use client'
import { StarIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { assets } from "@/assets/assets" // ตรวจสอบ path assets ให้ถูกต้อง

const ProductCard = ({ product }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    // ---------------------------------------------------------
    // 🔧 FIX: ใส่ค่า Rating หลอกๆ ไว้ก่อน (เช่น 4 ดาว)
    // เพราะ Database จริงยังไม่มีระบบ User Reviews
    // ---------------------------------------------------------
    const rating = 4; 

    // ---------------------------------------------------------
    // 🛡️ SAFE GUARD: ป้องกัน Error เรื่องรูปภาพ
    // ถ้าไม่มีรูปใน Array ให้ใช้รูป Placeholder จาก assets หรือรูปว่าง
    // ---------------------------------------------------------
    const mainImage = product.images?.[0] || assets.upload_area || '/placeholder.png';

    return (
        <Link href={`/product/${product.id}`} className='group max-xl:mx-auto'>
            <div className='bg-[#F5F5F5] h-40 sm:w-60 sm:h-68 rounded-lg flex items-center justify-center overflow-hidden relative'>
                <Image 
                    width={500} 
                    height={500} 
                    // ปรับ className ให้รูปไม่เบี้ยว (object-contain)
                    className='max-h-30 sm:max-h-40 w-auto group-hover:scale-110 transition duration-300 object-contain p-4' 
                    src={mainImage} 
                    alt={product.name || "Product Image"} 
                />
            </div>
            
            <div className='flex justify-between gap-3 text-sm text-slate-800 pt-3 max-w-60'>
                <div className='flex-1 overflow-hidden'>
                    {/* truncate ชื่อสินค้าไม่ให้ยาวเกินบรรทัด */}
                    <p className='font-medium truncate'>
                        {product.name} <span>{product.model}</span>
                    </p>
                    <p className='font-sm  text-slate-500'>
                        {product.specs.processor}
                    </p>
                    
                    <div className='flex items-center gap-1 mt-1'>
                        <div className='flex'>
                            {Array(5).fill('').map((_, index) => (
                                <StarIcon 
                                    key={index} 
                                    size={14} 
                                    className='mt-0.5' 
                                    // ใช้ logic เดิมแสดงดาวตามค่าที่ fix ไว้
                                    fill={rating >= index + 1 ? "#00C950" : "#E5E7EB"} 
                                    color={rating >= index + 1 ? "#00C950" : "#D1D5DB"}
                                />
                            ))}
                        </div>
                        {/* (Optional) แสดงตัวเลขจำนวนรีวิวหลอกๆ หรือซ่อนไปก่อน */}
                        {/* <span className='text-xs text-slate-400'>(0)</span> */}
                    </div>
                </div>
                
                {/* จัดการราคาให้มีลูกน้ำ (,) */}
                <p className='font-semibold whitespace-nowrap'>
                    {currency}{Number(product.price).toLocaleString()}
                </p>
            </div>
        </Link>
    )
}

export default ProductCard