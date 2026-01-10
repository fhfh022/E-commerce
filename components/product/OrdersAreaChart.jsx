'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function OrdersAreaChart({ allOrders }) {

    // 1. จัดกลุ่มออเดอร์ตามวัน (เหมือนเดิม)
    const ordersPerDay = (allOrders || []).reduce((acc, order) => {
        const rawDate = order.created_at || order.createdAt;
        if (!rawDate) return acc;

        const dateObj = new Date(rawDate);
        if (!isNaN(dateObj.getTime())) {
             const date = dateObj.toISOString().split('T')[0] // YYYY-MM-DD
             acc[date] = (acc[date] || 0) + 1
        }
        return acc
    }, {})

    // ✅ 2. ฟังก์ชันเติมวันที่ที่ขาดหายไป (ให้เป็น 0)
    const getChartDataWithGapsFilled = () => {
        const dates = Object.keys(ordersPerDay).sort();
        
        // ถ้าไม่มีข้อมูลเลย ให้คืนค่าว่าง
        if (dates.length === 0) return [];

        // หาวันเริ่มต้น (วันที่มีออเดอร์แรก) และวันสิ้นสุด (วันนี้)
        const startDate = new Date(dates[0]);
        const endDate = new Date(); // ใช้วันปัจจุบันเป็นจุดสิ้นสุด

        const result = [];
        const currentDate = new Date(startDate);

        // วนลูปตั้งแต่วันแรก จนถึงวันนี้
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            result.push({
                date: dateStr,
                orders: ordersPerDay[dateStr] || 0 // ถ้าวันไหนไม่มีออเดอร์ ให้ใส่ 0
            });
            // ขยับไปวันถัดไป
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return result;
    }

    const chartData = getChartDataWithGapsFilled();

    return (
        <div className="w-full max-w-4xl h-[300px] text-xs">
            <h3 className="text-lg font-medium text-slate-800 mb-4 pt-2 text-right"> 
                <span className='text-slate-500'>คำสั่งซื้อ /</span> วัน
            </h3>
            <ResponsiveContainer width="100%" height="100%"> 
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={(str) => {
                            const date = new Date(str);
                            return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                        }}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="orders" 
                        stroke="#4f46e5" 
                        fillOpacity={1} 
                        fill="url(#colorOrders)" 
                        strokeWidth={2} 
                        activeDot={{ r: 6 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}