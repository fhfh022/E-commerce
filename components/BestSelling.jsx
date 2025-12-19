'use client'
import Title from './Title'
import ProductCard from './ProductCard'
import { useSelector } from 'react-redux'

const BestSelling = () => {

    const displayQuantity = 8
    const products = useSelector(state => state.product.list)

    return (
        <div className='px-6 my-30 max-w-6xl mx-auto'>
            <Title title='Best Selling' description={`Showing ${products.length < displayQuantity ? products.length : displayQuantity} of ${products.length} products`} href='/shop' />
            
            {/* ปรับ Layout เป็น Grid เพื่อความสวยงามและรองรับ Responsive ได้ดีกว่า Flex */}
            <div className='mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-8'>
                {products
                    .slice(0, displayQuantity) // ตัดเอาแค่ 8 ชิ้นแรกมาแสดง
                    .map((product, index) => (
                        <ProductCard key={index} product={product} />
                    ))
                }
            </div>
        </div>
    )
}

export default BestSelling