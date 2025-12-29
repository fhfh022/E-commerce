'use client'

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CouponPopup from "@/components/product/CouponPopup";
import LiveChatWidget from "@/components/chat/LiveChatWidget";
export default function PublicLayout({ children }) {

    return (
        <>
            <CouponPopup />
            <LiveChatWidget/>
            <Navbar />
            {children}
            <Footer />
        </>
    );
}
