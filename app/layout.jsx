import { Prompt } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import SyncUser from "@/components/providers/SyncUser";
import RoleInitializer from "@/components/providers/RoleInitializer";
import AppInitializer from "../components/providers/AppInitializer";
import CookieConsent from "@/components/layout/CookieConsent";
// ✅ 1. Import Provider ที่สร้างใหม่

const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "PRT - Store",
  description: "PRT - Store",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      {/* ✅ 2. ใส่ suppressHydrationWarning ที่ html */}
      <html lang="en">
        <body className={`${prompt.className} antialiased`}>
          <StoreProvider>
            <AppInitializer>
              <Toaster />
              <SyncUser />
              <RoleInitializer />
              <CookieConsent />
              {children}
            </AppInitializer>
          </StoreProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
