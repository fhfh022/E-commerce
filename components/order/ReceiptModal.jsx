"use client";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { X, Printer } from "lucide-react";

export default function ReceiptModal({ order, onClose }) {
  const componentRef = useRef(null);

  // ✅ แก้ไขตรงนี้: ใช้ contentRef แทน content
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Receipt-${order.id}`,
  });

  if (!order) return null;

  const formatDateTH = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">รายละเอียดใบเสร็จ</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div 
            ref={componentRef} 
            className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-slate-800 mx-auto max-w-[210mm] min-h-[200px]"
          >
            <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="size-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
                        <h1 className="text-2xl font-bold text-slate-900">PRT STORE</h1>
                    </div>
                    <p className="text-sm text-slate-500">123 IT Building, Tech Road</p>
                    <p className="text-sm text-slate-500">Loei, Thailand 42000</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-indigo-600 uppercase tracking-widest mb-1">ใบเสร็จ</h2>
                    <p className="text-sm text-slate-500"># {order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-slate-500 mt-1">วันที่: {formatDateTH(order.created_at)}</p>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">ที่อยู่ตามใบเสร็จ</h3>
                <p className="font-bold text-slate-800">{order.address?.receiver_name || order.user?.name}</p>
                <p className="text-sm text-slate-600">{order.address?.detail}</p>
                <p className="text-sm text-slate-600">
                    {order.address?.sub_district} {order.address?.district}, {order.address?.province} {order.address?.postal_code}
                </p>
                <p className="text-sm text-slate-600 mt-1">Tel: {order.address?.phone_number}</p>
            </div>

            <table className="w-full text-sm mb-8">
                <thead>
                    <tr className="border-b-2 border-slate-100">
                        <th className="text-left py-3 font-bold text-slate-700">รายละเอียดสินค้า</th>
                        <th className="text-center py-3 font-bold text-slate-700 w-20">จํานวน</th>
                        <th className="text-right py-3 font-bold text-slate-700 w-32">ราคา</th>
                        <th className="text-right py-3 font-bold text-slate-700 w-32">จำนวนเงิน</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {order.order_items?.map((item, i) => (
                        <tr key={i}>
                            <td className="py-3 text-slate-600">
                                <span className="font-medium text-slate-800">{item.product?.name}</span>
                                {item.product?.model && (
                                    <span className="text-slate-400 ml-1">({item.product.model})</span>
                                )}
                            </td>
                            <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                            <td className="py-3 text-right text-slate-600">฿{item.price_at_time?.toLocaleString()}</td>
                            <td className="py-3 text-right font-medium text-slate-800">฿{(item.price_at_time * item.quantity).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end border-t border-slate-100 pt-6">
                <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Subtotal</span>
                        <span>฿{(order.total_amount + (order.discount_amount || 0)).toLocaleString()}</span>
                    </div>
                    {order.discount_amount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                            <span>Discount</span>
                            <span>-฿{order.discount_amount.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-slate-100 pt-2 mt-2">
                        <span>ยอดรวม</span>
                        <span>฿{order.total_amount.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center text-xs text-slate-400">
                <p>ขอบคุณสำหรับการใช้บริการของคุณ!</p>
                <p className="mt-1">สำหรับความช่วยเหลือ โปรดติดต่อ support@prtstore.com</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition">
            Close
          </button>
          <button onClick={handlePrint} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition flex items-center gap-2 shadow-lg shadow-slate-200">
            <Printer size={18} /> Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}