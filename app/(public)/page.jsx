'use client'
import BestSelling from "@/components/product/BestSelling";
import Hero from "@/components/layout/Hero";
import Newsletter from "@/components/layout/Newsletter";
import OurSpecs from "@/components/product/OurSpec";
import LatestProducts from "@/components/product/LatestProducts";

export default function Home() {
    return (
        <div>
            <Hero />
            <LatestProducts />
            {/* <BestSelling /> */}
            <OurSpecs />
            <Newsletter />
        </div>
    );
}
