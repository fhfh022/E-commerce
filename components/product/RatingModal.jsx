'use client'

import { Star, XIcon } from 'lucide-react';
import React, { useState } from 'react'
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase'; // import supabase
import { useDispatch, useSelector } from 'react-redux';
import { addRating } from '@/lib/features/rating/ratingSlice'; // import action

const RatingModal = ({ ratingModal, setRatingModal }) => {

    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    // ✅ ค้นหารีวิวเดิมที่มีอยู่ใน Redux
    const existingReview = useSelector(state => 
        state.rating.ratings.find(r => 
            r.orderId === ratingModal.orderId && r.productId === ratingModal.productId
        )
    );

    // ✅ กำหนด Initial State จากรีวิวเดิม (ถ้ามี)
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [review, setReview] = useState(existingReview?.comment || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) return toast.error('Please select a rating');
        setIsSubmitting(true);

        try {
            // ✅ ใช้ upsert เพื่อบันทึกหรืออัปเดตข้อมูลใน Supabase
            const { error } = await supabase
                .from('reviews')
                .upsert({
                    user_id: user.id,
                    product_id: ratingModal.productId,
                    order_id: ratingModal.orderId,
                    rating: rating,
                    comment: review
                }, { onConflict: 'user_id, product_id, order_id' }); // อ้างอิง Unique Constraint ใน DB

            if (error) throw error;

            dispatch(addRating({
                orderId: ratingModal.orderId,
                productId: ratingModal.productId,
                rating: rating,
                comment: review
            }));

            toast.success(existingReview ? 'Review updated!' : 'Review submitted!');
            setRatingModal(null);
        } catch (error) {
            toast.error('Failed to save review');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in'>
            <div className='bg-white p-8 rounded-2xl shadow-2xl w-96 relative animate-in zoom-in-95'>
                <button onClick={() => setRatingModal(null)} className='absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition'>
                    <XIcon size={20} />
                </button>
                
                <h2 className='text-xl font-bold text-slate-800 mb-6 text-center'>How was the product?</h2>
                
                <div className='flex items-center justify-center gap-2 mb-6'>
                    {Array.from({ length: 5 }, (_, i) => (
                        <Star
                            key={i}
                            className={`size-10 cursor-pointer transition-all hover:scale-110 ${rating > i ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`}
                            onClick={() => setRating(i + 1)}
                        />
                    ))}
                </div>
                
                <textarea
                    className='w-full p-4 border border-slate-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none'
                    placeholder='Write your review here... (optional)'
                    rows='4'
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                ></textarea>
                
                <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className='w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition active:scale-95 disabled:opacity-70'
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
            </div>
        </div>
    )
}

export default RatingModal