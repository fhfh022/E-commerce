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
  Tag,
  Sparkles,
  MessageCircleMore,
  Home,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import Banner from "./Banner";
import { useUser, useClerk, UserButton } from "@clerk/nextjs";

const Navbar = () => {
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();

  // Redux Selectors
  const role = useSelector((state) => state.user?.role);
  const isAdmin = role === "master_admin" || role === "admin";
  const cartItems = useSelector((state) => state?.cart?.cartItems) || {};
  const favoriteItems = useSelector((state) => state?.favorite?.items) || [];
  const products = useSelector((state) => state?.product?.list) || [];

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // ✅ OPTIMIZATION 1: คำนวณตัวเลข
  const itemCount = useMemo(() => {
    return Object.keys(cartItems).length > 0
      ? Object.values(cartItems).reduce(
          (total, qty) => total + (Number(qty) || 0),
          0
        )
      : 0;
  }, [cartItems]);

  const favoriteCount = useMemo(() => {
    return Array.isArray(favoriteItems) ? favoriteItems.length : 0;
  }, [favoriteItems]);

  // ✅ OPTIMIZATION 2: Logic Search (Name, Brand, Model)
  const searchSuggestions = useMemo(() => {
    if (!search || search.length < 2) return [];
    
    const query = search.toLowerCase();

    return products
      .filter((product) =>
        product.name?.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.model?.toLowerCase().includes(query)
      )
      .slice(0, 5);
  }, [search, products]);

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

  const handleAIClick = () => {
    if (!user) {
      openSignIn();
    } else {
      router.push("/ai-search");
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      <Banner />

      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-100/50 backdrop-blur-md">
        <div className="mx-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto py-4 transition-all">
            {/* Logo */}
            <Link
              href="/"
              className="relative text-4xl font-semibold text-slate-700"
            >
              <p className="absolute text-xs font-semibold -top-1 -right-9.5 px-2 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
                Store
              </p>
              <span className="text-green-600">PR</span>T
            </Link>

            {/* Desktop Menu */}
            <section
              id="desktop-menu"
              className="hidden items-center gap-4 text-slate-600 md:flex lg:gap-8"
            >
              <Link href="/" className="transition hover:text-green-600">
                หน้าหลัก
              </Link>
              <Link href="/shop" className="transition hover:text-green-600">
                สินค้า
              </Link>
              <Link
                href="/promotions"
                className="transition hover:text-green-600"
              >
                โปรโมชั่น
              </Link>

              {/* AI Button */}
              <button
                onClick={handleAIClick}
                className="group flex items-center gap-0 hover:gap-2 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-xs font-bold shadow-lg hover:shadow-indigo-200 transition-all duration-300 active:scale-95 animate-pulse hover:animate-none"
              >
                <Sparkles size={14} />
                <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:max-w-xs group-hover:ml-1">
                  PRT Assistant
                </span>
              </button>

              {/* ✅ Search Bar (ขยายขนาด) */}
              <div className="relative hidden xl:block">
                <form
                  onSubmit={handleSearch}
                  // เปลี่ยนจาก w-64 เป็น w-96 (กว้างขึ้นประมาณ 384px)
                  className="flex items-center w-96 gap-2 bg-slate-100 px-4 py-3 rounded-full text-sm focus-within:ring-2 focus-within:ring-green-100 transition-all"
                >
                  <Search size={18} className="text-slate-600" />
                  <input
                    className="w-full bg-transparent outline-none placeholder-slate-600"
                    type="text"
                    placeholder="ค้นหาสินค้า..." 
                    value={search}
                    onFocus={() => setIsSearchOpen(true)}
                    onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </form>

                {isSearchOpen &&
                  search.length >= 2 &&
                  searchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in zoom-in-95 duration-200">
                      <ul className="py-1">
                        {searchSuggestions.map((product) => (
                          <li
                            key={product.id}
                            onMouseDown={() =>
                              handleSuggestionClick(product.name)
                            }
                            className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-slate-50 text-slate-700 text-sm transition"
                          >
                            <span className="truncate font-medium">
                              {product.name} - {product.model}
                            </span>
                            <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full">
                              ${product.price}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div
                        onMouseDown={handleSearch}
                        className="px-4 py-2 text-center text-xs bg-slate-50 text-slate-500 border-t hover:bg-slate-100 rounded-b-lg cursor-pointer transition font-medium"
                      >
                        ดูผลลัพธ์ทั้งหมด ({products.length})
                      </div>
                    </div>
                  )}
              </div>

              {/* Icons Group */}
              <button
                onClick={() => {
                  if (!user && isLoaded) {
                    openSignIn();
                  } else {
                    router.push("/favorites");
                  }
                }}
                className="relative text-slate-600 transition hover:text-green-600 focus:outline-none hover:bg-slate-50 p-2 rounded-full"
                title="สินค้าที่ชอบ"
              >
                <Heart size={22} />
                {favoriteCount > 0 && (
                  <span className="absolute top-0 right-0 flex items-center justify-center size-4 bg-red-500 rounded-full text-[9px] text-white font-bold border-2 border-white">
                    {favoriteCount}
                  </span>
                )}
              </button>

              <Link
                href="/cart"
                className="relative text-slate-600 transition hover:text-green-600 focus:outline-none hover:bg-slate-50 p-2 rounded-full"
              >
                <ShoppingCart size={24} />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 flex items-center justify-center size-4 bg-red-500 rounded-full text-[9px] text-white font-bold border-2 border-white">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>

              {/* Auth Button */}
              {!isLoaded ? (
                <div className="w-[88px] h-[40px] bg-slate-100 rounded-full animate-pulse"></div>
              ) : !user ? (
                <button
                  onClick={openSignIn}
                  className="px-6 py-2 bg-indigo-500 rounded-full text-white text-sm font-medium transition hover:bg-indigo-600 shadow-md hover:shadow-lg active:scale-95"
                >
                  เข้าสู่ระบบ
                </button>
              ) : (
                <UserButton>
                  <UserButton.MenuItems>
                    <UserButton.Action
                      labelIcon={<PackageIcon size={16} />}
                      label="คำสั่งซื้อของฉัน"
                      onClick={() => router.push("/orders")}
                    />
                    <UserButton.Action
                      labelIcon={<MessageCircleMore size={16} />}
                      label="แชทกับเรา"
                      onClick={() => router.push("/chat")}
                    />

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

            {/* Mobile Controls */}
            <section
              id="mobile-controls"
              className="flex items-center gap-3 md:hidden"
            >
              <Link href="/cart" className="relative text-slate-600 p-2">
                <ShoppingCart size={22} />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 flex items-center justify-center size-4 bg-red-500 rounded-full text-[9px] text-white font-bold border-2 border-white">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-600 focus:outline-none p-1"
              >
                <div
                  className={`transition-all duration-300 ${
                    isMenuOpen ? "rotate-90 text-indigo-600" : "rotate-0"
                  }`}
                >
                  {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </div>
              </button>
            </section>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <section
          id="mobile-dropdown"
          className={`
            absolute top-full left-0 w-full bg-white/95 backdrop-blur-md shadow-xl overflow-hidden transition-all duration-300 ease-in-out md:hidden border-t border-slate-100
            ${isMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"}
          `}
        >
          <div className="flex flex-col gap-4 px-6 py-6 text-slate-600 font-medium overflow-y-auto max-h-[75vh]">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 transition hover:text-green-600 py-2 border-b border-slate-50"
            >
              <Home size={18} />หน้าหลัก
              
            </Link>
            <Link
              href="/shop"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 transition hover:text-green-600 py-2 border-b border-slate-50"
            >
              <PackageIcon size={18} />สินค้า
            </Link>
            <Link
              href="/promotions"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 transition hover:text-green-600 py-2 border-b border-slate-50"
            >
              <Tag size={18} />โปรโมชัน
            </Link>
            <Link
              href="/favorites"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 transition hover:text-green-600 py-2 border-b border-slate-50"
            >
              <Heart size={18} /> รายการโปรด{" "}
              {favoriteCount > 0 && (
                <span className="text-xs text-red-500 font-semibold bg-red-50 px-2 py-0.5 rounded-full">
                  {favoriteCount} จำนวน
                </span>
              )}
            </Link>

            {/* Mobile AI Button */}
            <button
              onClick={handleAIClick}
              className="group flex items-center justify-center w-full gap-2 px-3 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all mt-2 hover:shadow-indigo-200 animate-pulse hover:animate-none"
            >
              <Sparkles size={18} />
              ถาม PRT Assistant
            </button>

            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 bg-slate-100 px-4 py-3 rounded-xl mt-2 focus-within:ring-2 focus-within:ring-indigo-100 transition-all"
            >
              <Search size={18} className="text-slate-500" />
              <input
                className="w-full bg-transparent outline-none placeholder-slate-500 text-sm"
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>

            {/* Mobile Auth */}
            {!isLoaded ? (
              <div className="w-full h-[48px] bg-slate-100 rounded-xl animate-pulse mt-2"></div>
            ) : !user ? (
              <button
                onClick={openSignIn}
                className="w-full py-3 bg-indigo-500 rounded-xl text-white text-center mt-2 transition hover:bg-indigo-600 font-medium shadow-md"
              >
                เข้าสู่ระบบ / สมัครสมาชิก
              </button>
            ) : (
              <div className="mt-2 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-4 bg-slate-50 p-3 rounded-xl">
                  <UserButton afterSignOutUrl="/" />
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-sm">
                      {user.fullName || user.username}
                    </span>
                    <span className="text-xs text-slate-400">ดูโปรไฟล์</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/orders"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex flex-col items-center justify-center gap-1 py-3 px-2 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-indigo-100 hover:text-indigo-600 transition"
                  >
                    <PackageIcon size={20} />{" "}
                    <span className="text-xs font-medium">คำสั่งซื้อของฉัน</span>
                  </Link>

                  <Link
                    href="/chat"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex flex-col items-center justify-center gap-1 py-3 px-2 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-indigo-100 hover:text-indigo-600 transition"
                  >
                    <MessageCircleMore size={20} />{" "}
                    <span className="text-xs font-medium">แชทกับเรา</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex flex-col items-center justify-center gap-1 py-3 px-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl shadow-sm transition col-span-2"
                    >
                      <ClipboardList size={20} />{" "}
                      <span className="text-xs font-bold">Admin Dashboard</span>
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      href="/store"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex flex-col items-center justify-center gap-1 py-3 px-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl shadow-sm transition col-span-2"
                    >
                      <Package2 size={20} />{" "}
                      <span className="text-xs font-bold">Store Dashboard</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </nav>
    </>
  );
};

export default Navbar;