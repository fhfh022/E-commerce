import { createSlice } from "@reduxjs/toolkit";

// ✅ ประกาศ initialState เพียงครั้งเดียว
const initialState = {
  cartItems: {},
  total: 0,
  isLoaded: false,
};

export const cartSlice = createSlice({
  name: "cart",
  initialState, // ✅ ใช้ initialState ที่ประกาศไว้ด้านบน (ไม่ใช่สร้างใหม่)
  reducers: {
    addToCart: (state, action) => {
      const { productId } = action.payload;
      if (state.cartItems[productId]) {
        state.cartItems[productId] += 1;
      } else {
        state.cartItems[productId] = 1;
      }
      state.total = Object.values(state.cartItems).reduce((sum, qty) => sum + qty, 0);
    },
    removeFromCart: (state, action) => {
      const { productId } = action.payload;
      if (state.cartItems[productId] && state.cartItems[productId] > 0) {
        state.cartItems[productId] -= 1;
        if (state.cartItems[productId] === 0) {
          delete state.cartItems[productId];
        }
      }
      state.total = Object.values(state.cartItems).reduce((sum, qty) => sum + qty, 0);
    },
    deleteItemFromCart: (state, action) => {
      const { productId } = action.payload;
      delete state.cartItems[productId];
      state.total = Object.values(state.cartItems).reduce((sum, qty) => sum + qty, 0);
    },
    setCartItems: (state, action) => {
      const items = action.payload;
      // ✅ รับค่าและป้องกัน null/undefined
      state.cartItems = items && typeof items === 'object' && !Array.isArray(items) ? items : {};
      state.isLoaded = true;
      state.total = Object.values(state.cartItems).reduce((sum, qty) => sum + qty, 0);
    },
    updateCartQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      if (quantity > 0) {
        state.cartItems[productId] = quantity;
      } else {
        delete state.cartItems[productId];
      }
      state.total = Object.values(state.cartItems).reduce((sum, qty) => sum + qty, 0);
    },
    clearCart: (state) => {
      state.cartItems = {};
      state.total = 0;
      state.isLoaded = false;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  deleteItemFromCart,
  setCartItems,
  updateCartQuantity,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;