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
            
            <div className='mt-12 grid grid-cols-2 sm:flex flex-wrap gap-6 justify-between'>
                {availableProducts
                    .slice()
                    .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
                    .slice(0, displayQuantity)
                    .map((product, index) => (
                        <ProductCard 
                            key={product.id || index} 
                            product={product} 
                            hideLikeButton={true} // ✅ [ใส่ตรงนี้] เพื่อซ่อนปุ่มหัวใจในหน้า Home
                        />
                    ))
                }
            </div>
        </div>
    )
}

export default LatestProducts