"use client";
import Image from "next/image";
import { DotIcon } from "lucide-react";
import { useSelector } from "react-redux";
import Rating from "./Rating";
import { useState } from "react";
import RatingModal from "./RatingModal";

const OrderItem = ({ order }) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";
  const [ratingModal, setRatingModal] = useState(null);
  const { ratings } = useSelector((state) => state.rating);

  // ตรวจสอบว่ามีข้อมูล address หรือไม่ (กัน Error)
  const addr = order.address || {};

  return (
    <>
      <tr className="text-sm shadow-sm bg-white rounded-lg">
        <td className="text-left p-4">
          <div className="flex flex-col gap-6">
            {order.order_items?.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-20 aspect-square bg-slate-100 flex items-center justify-center rounded-md flex-shrink-0">
                  <Image
                    className="h-14 w-auto object-contain"
                    src={item.product?.images?.[0] || "/placeholder.png"}
                    alt="product_img"
                    width={50}
                    height={50}
                  />
                </div>
                <div className="flex flex-col justify-center text-sm">
                  <p className="font-medium text-slate-600 text-base">
                    {item.product?.name}
                  </p>
                  <p>
                    {currency}
                    {item.price_at_time || item.product?.price} | Qty:{" "}
                    {item.quantity}
                  </p>
                  <p className="text-xs text-slate-400 mb-1">
                    {new Date(order.created_at).toDateString()}
                  </p>
                  <div>
                    {ratings.find(
                      (rating) =>
                        order.id === rating.orderId &&
                        item.product?.id === rating.productId
                    ) ? (
                      <div className="flex flex-col gap-1">
                        {/* แสดงคะแนนเดิม */}
                        <Rating
                          value={
                            ratings.find(
                              (r) =>
                                order.id === r.orderId &&
                                item.product?.id === r.productId
                            ).rating
                          }
                        />
                        {/* ✅ เพิ่มปุ่ม Edit Review */}
                        <button
                          onClick={() =>
                            setRatingModal({
                              orderId: order.id,
                              productId: item.product?.id,
                            })
                          }
                          className="text-[10px] text-blue-500 hover:underline text-left"
                        >
                          Edit Review
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setRatingModal({
                            orderId: order.id,
                            productId: item.product?.id,
                          })
                        }
                        className={`text-xs font-medium text-green-600 hover:text-green-700 hover:underline transition ${
                          order.status !== "delivered" && "hidden"
                        }`}
                      >
                        Rate Product
                      </button>
                    )}
                  </div>
                  {ratingModal && (
                    <RatingModal
                      ratingModal={ratingModal}
                      setRatingModal={setRatingModal}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </td>

        <td className="text-center font-semibold text-slate-700 max-md:hidden">
          {currency}
          {order.total_amount?.toLocaleString()}
        </td>

        <td className="text-left max-md:hidden text-xs leading-relaxed text-slate-500">
          <p className="font-bold text-slate-700">{addr.receiver_name}</p>
          <p>
            {addr.detail} {addr.sub_district}
          </p>
          <p>
            {addr.district}, {addr.province} {addr.postal_code}
          </p>
          <p className="mt-1 flex items-center gap-1">📞 {addr.phone_number}</p>
        </td>

        <td className="text-left space-y-2 text-sm max-md:hidden p-4">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                        ${
                          order.status === "processing"
                            ? "text-blue-600 bg-blue-50"
                            : ""
                        }
                        ${
                          order.status === "shipped"
                            ? "text-yellow-600 bg-yellow-50"
                            : ""
                        }
                        ${
                          order.status === "delivered"
                            ? "text-green-600 bg-green-50"
                            : ""
                        }
                        ${
                          order.status === "cancelled"
                            ? "text-red-600 bg-red-50"
                            : ""
                        }
                        `}
          >
            <DotIcon size={16} className="-ml-1 mr-1" />
            {order.status}
          </div>
        </td>
      </tr>

      {/* Mobile View */}
      <tr className="md:hidden border-b border-slate-100">
        <td colSpan={5} className="p-4 bg-slate-50/50">
          <div className="text-xs text-slate-500 mb-3">
            <p className="font-bold">{addr.receiver_name}</p>
            <p>
              {addr.detail}, {addr.province}
            </p>
            <p>{addr.phone_number}</p>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800">
              Total: {currency}
              {order.total_amount?.toLocaleString()}
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                order.status === "delivered"
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {order.status}
            </span>
          </div>
        </td>
      </tr>
    </>
  );
};

export default OrderItem;
