'use client'
import React from 'react'
import toast from 'react-hot-toast';

export default function Banner() {

    const [isOpen, setIsOpen] = React.useState(true);

    const handleClaim = () => {
        setIsOpen(false);
        toast.success('Coupon copied to clipboard!');
        navigator.clipboard.writeText('NEW20');
    };

    return (
        // ใช้ div ครอบเพื่อทำ Animation ความสูง
        // ถ้า isOpen = true -> max-height สูงพอให้เห็นเนื้อหา
        // ถ้า isOpen = false -> max-height = 0 (ซ่อนและหดพื้นที่)
        <div 
            className={`
                w-full bg-gradient-to-r from-violet-500 via-[#9938CA] to-[#E0724A] text-white 
                overflow-hidden transition-all duration-500 ease-in-out
                ${isOpen ? 'max-h-[60px] opacity-100' : 'max-h-0 opacity-0'}
            `}
        >
            {/* เนื้อหาข้างใน (เพิ่ม h-full เพื่อให้มั่นใจว่า content หดตาม) */}
            <div className={`px-6 py-1 font-medium text-sm text-center transition-all duration-300 ${!isOpen && 'py-0'}`}>
                <div className='flex items-center justify-between max-w-7xl mx-auto'>
                    <p>Get 20% OFF on Your First Order!</p>
                    <div className="flex items-center space-x-6">
                        <button 
                            onClick={handleClaim} 
                            type="button" 
                            className="font-normal text-gray-800 bg-white px-7 py-2 rounded-full max-sm:hidden hover:bg-gray-100 transition"
                        >
                            Claim Offer
                        </button>
                        
                        <button 
                            onClick={() => setIsOpen(false)} 
                            type="button" 
                            className="font-normal text-white py-2 rounded-full hover:scale-110 transition-transform"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect y="12.532" width="17.498" height="2.1" rx="1.05" transform="rotate(-45.74 0 12.532)" fill="currentColor" />
                                <rect x="12.533" y="13.915" width="17.498" height="2.1" rx="1.05" transform="rotate(-135.74 12.533 13.915)" fill="currentColor" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};