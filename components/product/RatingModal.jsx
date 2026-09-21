"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Star, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

export default function RatingModal({
  isOpen,
  setRatingModal,
  product,
  orderId,
  userId,
  existingReview, // ✅ รับ Props รีวิวเดิม
  onReviewSaved, // ✅ รับ Props Callback
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ เมื่อเปิด Modal ถ้ามีรีวิวเดิม ให้เอาค่ามาใส่รอไว้
  useEffect(() => {
    if (isOpen && existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || "");
    } else if (isOpen && !existingReview) {
      // ถ้าไม่มีรีวิวเดิม (หรือกดสินค้าใหม่) ให้เคลียร์ค่า
      setRating(0);
      setComment("");
    }
  }, [isOpen, existingReview]);

  const handleClose = () => {
    if (typeof setRatingModal === "function") {
      setRatingModal(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("กรุณาให้คะแนนก่อนส่งรีวิว");
      return;
    }

    setIsSubmitting(true);

    try {
      if (!userId || !product?.id || !orderId) {
        throw new Error("Missing data.");
      }

      let error;

      if (existingReview) {
        // 🔄 กรณีแก้ไข (UPDATE)
        const { error: updateError } = await supabase
          .from("reviews")
          .update({
            rating: rating,
            comment: comment,
            // created_at: new Date().toISOString() // จะอัปเดตเวลาด้วยก็ได้
          })
          .eq("id", existingReview.id); // อ้างอิงจาก ID รีวิวเดิม
        error = updateError;
      } else {
        // ➕ กรณีเพิ่มใหม่ (INSERT)
        const { error: insertError } = await supabase.from("reviews").insert({
          user_id: userId,
          product_id: product.id,
          order_id: orderId,
          rating: rating,
          comment: comment,
        });
        error = insertError;
      }

      if (error) throw error;

      toast.success(
        existingReview ? "รีวิวถูกอัปเดตแล้ว!" : "รีวิวถูกส่งแล้ว!",
      );

      // ✅ แจ้ง Parent ว่าเซฟเสร็จแล้วนะ ให้ดึงข้อมูลใหม่ด้วย
      if (onReviewSaved) onReviewSaved();

      handleClose();
    } catch (error) {
      console.error("Submit review error:", error);
      toast.error(error.message || "เกิดข้อผิดพลาดในการส่งรีวิว");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">
            {existingReview ? "แก้ไขรีวิว" : "ให้คะแนนสินค้า"}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {existingReview
              ? "อัปเดตประสบการณ์ของคุณ"
              : "ประสบการณ์ของคุณเป็นอย่างไร?"}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl mb-6 border border-slate-100">
          <div className="relative size-16 bg-white rounded-lg border border-slate-200 p-1 flex-shrink-0">
            <Image
              src={product?.images?.[0] || "/placeholder.png"}
              alt={product?.name || "Product"}
              fill
              className="object-contain p-1"
            />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-700 truncate text-sm">
              {product?.name}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{product?.model}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  size={32}
                  className={`transition-colors ${
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-slate-300 fill-slate-100"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              ความคิดเห็น (ไม่บังคับ)
            </label>
            <textarea
              rows="3"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition text-sm resize-none"
              placeholder="เขียนรีวิวของคุณ..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition text-sm"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition text-sm shadow-lg shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  {" "}
                  <Loader2 size={16} className="animate-spin" />{" "}
                  {existingReview ? "Updating..." : "Submitting..."}{" "}
                </>
              ) : existingReview ? (
                "อัพเดตรีวิว"
              ) : (
                "ส่งรีวิว"
              )}
            </button>
          </div>
        </form>

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
