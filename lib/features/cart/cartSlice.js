import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cartItems: {},
  isLoaded: false, // เก็บข้อมูลในรูปแบบ { productId: quantity }
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { productId } = action.payload;
      // ถ้ามีสินค้านี้อยู่แล้ว ให้บวกเพิ่ม 1, ถ้ายังไม่มีให้เริ่มที่ 1
      if (state.cartItems[productId]) {
        state.cartItems[productId] += 1;
      } else {
        state.cartItems[productId] = 1;
      }
    },
    removeFromCart: (state, action) => {
      const { productId } = action.payload;
      // ลดจำนวนลง 1
      if (state.cartItems[productId] > 0) {
        state.cartItems[productId] -= 1;
        // ถ้าเหลือ 0 ให้ลบออกจากตะกร้า
        if (state.cartItems[productId] === 0) {
          delete state.cartItems[productId];
        }
      }
    },
    deleteItemFromCart: (state, action) => {
      const { productId } = action.payload;
      delete state.cartItems[productId];
    },
    // ✅ [เพิ่มส่วนนี้] เพื่อแก้ Error
    setCartItems: (state, action) => {
      state.cartItems = action.payload;
      state.isLoaded = true;
    },
    // [เสริม] สำหรับอัปเดตจำนวนโดยระบุเลขตรงๆ (ใช้ในหน้า Cart)
    updateCartQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      state.cartItems[productId] = quantity;
    },
    // [เสริม] สำหรับล้างตะกร้าเมื่อ Logout
    clearCart: (state) => {
      state.cartItems = {};
    },
  },
});

// อย่าลืม export setCartItems ออกไปใช้ด้วย
export const {
  addToCart,
  removeFromCart,
  deleteItemFromCart,
  setCartItems, // ✅ ต้องมีตัวนี้
  updateCartQuantity,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
