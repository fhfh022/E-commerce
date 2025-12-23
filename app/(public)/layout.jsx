'use client'

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CouponPopup from "@/components/product/CouponPopup";
export default function PublicLayout({ children }) {

    return (
        <>
            <CouponPopup />
            <Navbar />
            {children}
            <Footer />
        </>
    );
}
