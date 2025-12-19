import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import SyncUser from "@/app/SyncUser";
import RoleInitializer from "@/components/RoleInitializer";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
  title: "PRT. - IT Store",
  description: "PRT. - IT Store",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${outfit.className} antialiased`}>
          <StoreProvider>
            <Toaster />
            <SyncUser />
            <RoleInitializer />
            {children}
          </StoreProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
