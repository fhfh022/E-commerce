'use client'
import React from 'react'
import Title from '../layout/Title'
import ProductCard from './ProductCard'
import { useSelector } from 'react-redux'

const LatestProducts = () => {

    const displayQuantity = 4
    const products = useSelector(state => state.product.list)
    
    // กรองสินค้ามีสต็อก
    const availableProducts = products.filter(product => product.in_stock === true);

    return (
        <div className='px-6 my-30 max-w-6xl mx-auto'>
            <Title 
                title='Latest Products' 
                description={`Showing ${availableProducts.length < displayQuantity ? availableProducts.length : displayQuantity} of ${availableProducts.length} products`} 
                href='/shop' 
            />
            
            {/* ✅ ปรับจาก flex-wrap เป็น Grid System เพื่อควบคุมขนาดการ์ด */}
            <div className='mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8'>
                {availableProducts
                    .slice()
                    .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
                    .slice(0, displayQuantity)
                    .map((product, index) => (
                        <div key={product.id || index} className="flex justify-center">
                            <ProductCard 
                                product={product} 
                                hideLikeButton={true} 
                                hideRating={true}
                            />
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default LatestProducts