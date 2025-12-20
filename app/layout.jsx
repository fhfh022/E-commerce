import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import SyncUser from "@/components/providers/SyncUser";
import RoleInitializer from "@/components/providers/RoleInitializer";
import AppInitializer from "../components/providers/AppInitializer";

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
            <AppInitializer>
              <Toaster />
              <SyncUser />
              <RoleInitializer />
              {children}
            </AppInitializer>
          </StoreProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
