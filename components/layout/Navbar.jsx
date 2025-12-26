"use client";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  PackageIcon,
  ClipboardList,
  Package2,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux"; // ✅ ใช้ useSelector ดึง Role
import Banner from "./Banner";
import { useUser, useClerk, UserButton } from "@clerk/nextjs";

const Navbar = () => {
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();

  // ❌ ลบส่วนนี้ออก (เพราะมันไม่อัปเดตตาม Supabase)
  // const role = user?.publicMetadata?.role;
  
  // ✅ เปลี่ยนมาใช้ Role จาก Redux Store (ที่ดึงมาจาก Supabase จริงๆ)
  const role = useSelector((state) => state.user?.role); 
  const isAdmin = role === "master_admin" || role === "admin";

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // ... (ส่วนที่เหลือของไฟล์เหมือนเดิม ไม่ต้องแก้) ...
  // ตรวจสอบให้แน่ใจว่า code ด้านล่างยังคงเดิม
  
  const cartItems = useSelector((state) => state?.cart?.cartItems) || {};
  const favoriteItems = useSelector((state) => state?.favorite?.items) || [];
  const products = useSelector((state) => state?.product?.list) || [];

  const itemCount = Object.keys(cartItems).length > 0
    ? Object.values(cartItems).reduce((total, qty) => total + (Number(qty) || 0), 0)
    : 0;

  const favoriteCount = Array.isArray(favoriteItems) ? favoriteItems.length : 0;

  const getSuggestions = () => {
    if (!search || search.length < 2) return [];
    return products
      .filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 5);
  };
  const searchSuggestions = getSuggestions();

  const handleSearch = (e) => {
    e.preventDefault();
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    router.push(`/shop?search=${search}`);
  };

  const handleSuggestionClick = (productName) => {
    setSearch(productName);
    setIsSearchOpen(false);
    router.push(`/shop?search=${productName}`);
  };

  if (!isLoaded) return null;

  return (
    <header>
      <Banner />
      <nav className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto py-4 transition-all">
            <Link
              href="/"
              className="relative text-4xl font-semibold text-slate-700"
            >
              <p className="absolute text-xs font-semibold -top-1 -right-9.5 px-2 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
                Store
              </p>
              <span className="text-green-600">PR</span>T
              <span className="text-green-600 text-5xl leading-0"></span>
            </Link>

            <section
              id="desktop-menu"
              className="hidden items-center gap-4 text-slate-600 md:flex lg:gap-8"
            >
              <Link href="/" className="transition hover:text-green-600">
                Home
              </Link>
              <Link href="/shop" className="transition hover:text-green-600">
                Shop
              </Link>
              <Link
                href="/promotions"
                className="transition hover:text-green-600"
              >
                Promotions
              </Link>

              <div className="relative hidden xl:block">
                <form
                  onSubmit={handleSearch}
                  className="flex items-center w-64 gap-2 bg-slate-100 px-4 py-3 rounded-full text-sm"
                >
                  <Search size={18} className="text-slate-600" />
                  <input
                    className="w-full bg-transparent outline-none placeholder-slate-600"
                    type="text"
                    placeholder="Search products"
                    value={search}
                    onFocus={() => setIsSearchOpen(true)}
                    onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                    onChange={(e) => setSearch(e.target.value)}
                    required
                  />
                </form>

                {isSearchOpen &&
                  search.length >= 2 &&
                  searchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <ul className="py-1">
                        {searchSuggestions.map((product) => (
                          <li
                            key={product.id}
                            onMouseDown={() =>
                              handleSuggestionClick(product.name)
                            }
                            className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-slate-100 text-slate-700 text-sm transition"
                          >
                            <span className="truncate">{product.name}</span>
                            <span className="text-xs text-green-600 font-semibold">
                              ${product.price}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div
                        onMouseDown={handleSearch}
                        className="px-4 py-2 text-center text-xs bg-slate-50 text-slate-600 border-t hover:bg-slate-100 rounded-b-lg cursor-pointer transition"
                      >
                        ดูผลลัพธ์ทั้งหมด ({products.length} รายการ)
                      </div>
                    </div>
                  )}

                {isSearchOpen &&
                  search.length >= 2 &&
                  searchSuggestions.length === 0 && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 text-sm text-slate-500">
                      ไม่พบสินค้าที่ตรงกับ "{search}"
                    </div>
                  )}
              </div>

              <button
                onClick={() => {
                  if (!user) {
                    openSignIn();
                  } else {
                    router.push("/favorites");
                  }
                }}
                className="relative text-slate-600 transition hover:text-green-600 focus:outline-none"
                title="My Favorites"
              >
                <Heart size={22} />
                {favoriteCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center size-3.5 bg-red-500 rounded-full text-[8px] text-white font-bold">
                    {favoriteCount}
                  </span>
                )}
              </button>

              <Link
                href="/cart"
                className="relative text-slate-600 transition hover:text-green-600 focus:outline-none"
              >
                <ShoppingCart size={24} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center size-3.5 bg-red-500 rounded-full text-[8px] text-white font-bold">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>

              {!user ? (
                <button
                  onClick={openSignIn}
                  className="px-8 py-2 bg-indigo-500 rounded-full text-white transition hover:bg-indigo-600"
                >
                  Login
                </button>
              ) : (
                <UserButton>
                  <UserButton.MenuItems>
                    <UserButton.Action
                      labelIcon={<PackageIcon size={16} />}
                      label="My Orders"
                      onClick={() => router.push("/orders")}
                    />

                    {/* ✅ ส่วนนี้จะแสดงถูกต้องแล้วเพราะ isAdmin มาจาก Redux */}
                    {isAdmin && (
                      <UserButton.Action
                        labelIcon={<ClipboardList size={16} />}
                        label="Admin Dashboard"
                        onClick={() => router.push("/admin")}
                      />
                    )}

                    {isAdmin && (
                      <UserButton.Action
                        labelIcon={<Package2 size={16} />}
                        label="Store Dashboard"
                        onClick={() => router.push("/store")}
                      />
                    )}
                  </UserButton.MenuItems>
                </UserButton>
              )}
            </section>

            <section
              id="mobile-controls"
              className="flex items-center gap-4 md:hidden"
            >
              <Link href="/cart" className="relative text-slate-600">
                <ShoppingCart size={22} />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex items-center justify-center size-4 bg-red-500 rounded-full text-[8px] text-white">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-600 focus:outline-none"
              >
                <div
                  className={`transition-all duration-300 ${
                    isMenuOpen ? "rotate-90" : "rotate-0"
                  }`}
                >
                  {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </div>
              </button>
            </section>
          </div>
        </div>

        <section
          id="mobile-dropdown"
          className={`
            absolute top-full left-0 w-full bg-white shadow-xl overflow-hidden transition-all duration-300 ease-in-out md:hidden
            ${isMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}
          `}
        >
          <div className="flex flex-col gap-4 px-6 py-6 border-t border-gray-100 text-slate-600 font-medium">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="transition hover:text-green-600"
            >
              Home
            </Link>
            <Link
              href="/shop"
              onClick={() => setIsMenuOpen(false)}
              className="transition hover:text-green-600"
            >
              Shop
            </Link>
            <Link
              href="/favorites"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 transition hover:text-green-600"
            >
              <Heart size={18} /> Favorites
              {favoriteCount > 0 && (
                <span className="text-xs text-red-500 font-semibold">
                  ({favoriteCount})
                </span>
              )}
            </Link>

            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 bg-slate-100 px-4 py-3 rounded-full mt-2"
            >
              <Search size={18} className="text-slate-600" />
              <input
                className="w-full bg-transparent outline-none placeholder-slate-600"
                type="text"
                placeholder="Search products"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>

            {!user ? (
              <button
                onClick={openSignIn}
                className="w-full py-3 bg-indigo-500 rounded-full text-white text-center mt-2 transition hover:bg-indigo-600"
              >
                Login
              </button>
            ) : (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                  <div className="flex items-center gap-3">
                    <UserButton afterSignOutUrl="/" />
                    <span className="font-semibold text-slate-700">
                      {user.username || user.fullName}
                    </span>
                  </div>
                </div>

                <Link
                  href="/cart"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 py-2 px-3 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                >
                  <ShoppingCart size={18} /> Cart
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 py-2 px-3 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                >
                  <PackageIcon size={18} /> My Orders
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 py-2 px-3 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                  >
                    <ClipboardList size={18} /> Admin Dashboard
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    href="/store"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 py-2 px-3 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                  >
                    <Package2 size={18} /> Store Dashboard
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        <hr className="border-gray-300" />
      </nav>
    </header>
  );
};

export default Navbar;