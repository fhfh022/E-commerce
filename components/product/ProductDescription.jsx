'use client'
import { useState } from "react"

const ProductDescription = ({ product }) => {

    // เพิ่ม Tab 'Specifications' เข้าไปใน Array
    const [selectedTab, setSelectedTab] = useState('Specifications')
    const tabs = ['Specifications', 'Reviews']; 

    // ดึงข้อมูล Specs (กัน Error ถ้าเป็น null)
    const specs = product.specs || {};

    // กำหนด Mapping ข้อมูลที่จะแสดงในตาราง
    const specList = [
        { label: "Brand", value: product.brand },
        { label: "Model", value: product.model },
        { label: "Processor", value: specs.processor },
        { label: "Graphics", value: specs.graphics },
        { label: "Display Screen", value: specs.display },
        { label: "Main Memory", value: specs.ram },
        { label: "Storage", value: specs.storage },
        { label: "Network", value: specs.network },
        { label: "Wireless", value: specs.wireless },
        { label: "Bluetooth", value: specs.bluetooth },
        { label: "Ports", value: specs.ports },
        { label: "Battery", value: specs.battery },
        { label: "OS", value: specs.os },
        { label: "Weight", value: specs.weight },
    ];

    return (
        <div className="my-16 text-sm text-slate-600">

            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 mb-8">
                {tabs.map((tab, index) => (
                    <button 
                        key={index} 
                        onClick={() => setSelectedTab(tab)}
                        className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                            tab === selectedTab 
                            ? 'border-slate-800 text-slate-800 font-semibold' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content: Specifications */}
            {selectedTab === "Specifications" && (
                <div className="animate-fade-in">
                    <div className="border rounded-lg overflow-hidden max-w-3xl">
                        {specList.map((item, index) => (
                            item.value ? (
                                <div key={index} className={`flex flex-col sm:flex-row border-b last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                    <div className="sm:w-1/3 p-4 font-medium text-slate-700 sm:border-r">
                                        {item.label}
                                    </div>
                                    <div className="sm:w-2/3 p-4 text-slate-600 break-words">
                                        {item.value}
                                    </div>
                                </div>
                            ) : null
                        ))}
                        
                        {specList.every(s => !s.value) && (
                             <div className="p-6 text-center text-slate-400">No specifications available for this product.</div>
                        )}
                    </div>
                </div>
            )}

            {/* Reviews */}
            {/* {selectedTab === "Reviews" && (
                <div className="flex flex-col gap-3 mt-14">
                    {product.rating.map((item,index) => (
                        <div key={index} className="flex gap-5 mb-10">
                            <Image src={item.user.image} alt="" className="size-10 rounded-full" width={100} height={100} />
                            <div>
                                <div className="flex items-center" >
                                    {Array(5).fill('').map((_, index) => (
                                        <StarIcon key={index} size={18} className='text-transparent mt-0.5' fill={item.rating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                                    ))}
                                </div>
                                <p className="text-sm max-w-lg my-4">{item.review}</p>
                                <p className="font-medium text-slate-800">{item.user.name}</p>
                                <p className="mt-3 font-light">{new Date(item.createdAt).toDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )} */}

           
        </div>
    )
}

export default ProductDescription