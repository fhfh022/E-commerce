'use client'
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function OrderTimer({ createdAt, onExpire }) {
    const [timeLeft, setTimeLeft] = useState("");
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        // เวลาหมดอายุ = เวลาสร้าง + 10 นาที
        const expiryTime = new Date(new Date(createdAt).getTime() + 10 * 60 * 1000);

        const interval = setInterval(() => {
            const now = new Date();
            const difference = expiryTime - now;

            if (difference <= 0) {
                clearInterval(interval);
                setTimeLeft("00:00");
                setIsExpired(true);
                if (onExpire) onExpire(); // Callback เมื่อหมดเวลา (ถ้ามี)
            } else {
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [createdAt, onExpire]);

    if (isExpired) return <span className="text-red-500 font-bold text-xs">Expired</span>;

    return (
        <div className="flex items-center gap-1 text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded-md border border-red-100 animate-pulse">
            <Clock size={12} />
            <span>Pay in {timeLeft}</span>
        </div>
    );
}