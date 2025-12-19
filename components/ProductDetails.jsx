'use client'

import { addToCart } from "@/lib/features/cart/cartSlice";
// ลบ TagIcon ออกเพราะไม่ได้ใช้แล้ว (เดิมใช้ตรงโชว์ส่วนลด)
import { StarIcon, EarthIcon, CreditCardIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";

const ProductDetails = ({ product }) => {

    const productId = product.id;
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';

    const cart = useSelector(state => state.cart.cartItems);
    const dispatch = useDispatch();
    const router = useRouter()

    // -----------------------------------------------------------------
    // 🛡️ Image Safety Logic
    // -----------------------------------------------------------------
    const imageList = product.images || [];
    const [mainImage, setMainImage] = useState(imageList[0] || null);

    // -----------------------------------------------------------------
    // 🔧 Rating Logic (Fix ค่าไว้ก่อน)
    // -----------------------------------------------------------------
    const averageRating = 4;
    const reviewCount = 0;

    const addToCartHandler = () => {
        dispatch(addToCart({ productId }))
    }

    // -----------------------------------------------------------------
    // 💰 Price Logic
    // เหลือแค่ราคาขายจริง (Price) อย่างเดียว ไม่ต้องคำนวณ Discount
    // -----------------------------------------------------------------
    const price = Number(product.price);

    return (
        <div className="flex max-lg:flex-col gap-12">
            {/* --- Image Section --- */}
            <div className="flex max-sm:flex-col-reverse gap-3">
                {/* Thumbnails */}
                <div className="flex sm:flex-col gap-3">
                    {imageList.length > 0 ? (
                        imageList.map((image, index) => (
                            <div 
                                key={index} 
                                onClick={() => setMainImage(image)} 
                                className={`bg-slate-100 flex items-center justify-center size-26 rounded-lg cursor-pointer border ${mainImage === image ? 'border-blue-500' : 'border-transparent'}`}
                            >
                                <Image src={image} className="hover:scale-105 transition object-contain p-2" alt="" width={45} height={45} />
                            </div>
                        ))
                    ) : null}
                </div>

                {/* Main Image */}
                <div className="flex justify-center items-center h-100 sm:size-113 bg-slate-100 rounded-lg overflow-hidden relative">
                    {mainImage ? (
                         <Image src={mainImage} alt={product.name} width={400} height={400} className="object-contain max-h-[80%] w-auto" priority />
                    ) : (
                        <div className="text-slate-400">No Image Available</div>
                    )}
                </div>
            </div>

            {/* --- Details Section --- */}
            <div className="flex-1">
                <h1 className="text-3xl font-semibold text-slate-800">{product.name}<span>{product.model}</span></h1>
                
                {/* Rating */}
                <div className='flex items-center mt-2'>
                    {Array(5).fill('').map((_, index) => (
                        <StarIcon key={index} size={14} className='mt-0.5' 
                            fill={averageRating >= index + 1 ? "#00C950" : "#E5E7EB"} 
                            color={averageRating >= index + 1 ? "#00C950" : "#D1D5DB"}
                        />
                    ))}
                    <p className="text-sm ml-3 text-slate-500">({reviewCount} Reviews)</p>
                </div>

                {/* Price (แสดงแค่ราคาขาย) */}
                <div className="flex items-center my-6 gap-3 font-semibold text-slate-800">
                    <p className="text-3xl"> {currency}{price.toLocaleString()} </p>
                </div>

                {/* Description */}
                {/* <div className="text-slate-500 mb-8 leading-relaxed">
                    {product.description || "No description available for this product."}
                </div> */}

                {/* Action Buttons */}
                <div className="flex items-center gap-5">
                    {
                        cart[productId] && (
                            <div className="flex flex-col gap-2">
                                <p className="text-sm text-slate-800 font-semibold">Quantity</p>
                                <Counter productId={productId} />
                            </div>
                        )
                    }
                    <button 
                        onClick={() => !cart[productId] ? addToCartHandler() : router.push('/cart')} 
                        className="bg-slate-900 text-white px-10 py-3.5 text-sm font-bold rounded shadow-lg hover:bg-slate-800 active:scale-95 transition flex-1 sm:flex-none"
                    >
                        {!cart[productId] ? 'Add to Cart' : 'View Cart'}
                    </button>
                </div>

                <hr className="border-gray-200 my-8" />

                {/* Features */}
                <div className="flex flex-col gap-4 text-slate-500 text-sm">
                    <p className="flex items-center gap-3"> <EarthIcon size={18} className="text-slate-400" /> Free shipping worldwide </p>
                    <p className="flex items-center gap-3"> <CreditCardIcon size={18} className="text-slate-400" /> 100% Secured Payment </p>
                    <p className="flex items-center gap-3"> <UserIcon size={18} className="text-slate-400" /> Trusted by top brands </p>
                </div>

            </div>
        </div>
    )
}

export default ProductDetails