import { createSlice } from "@reduxjs/toolkit";

const ratingSlice = createSlice({
  name: "rating",
  initialState: {
    ratings: [], // เก็บรายการรีวิวของ User คนนี้
  },
  reducers: {
    // ใช้ตอนโหลดหน้า Orders เพื่อดูว่าเคยรีวิวอะไรไปบ้าง
    setUserRatings: (state, action) => {
      state.ratings = action.payload;
    },
    // ใช้ตอนกด Submit รีวิวใหม่สำเร็จ
    addRating: (state, action) => {
      // ✅ ตรวจสอบว่ามีรีวิวนี้อยู่แล้วหรือไม่ ถ้ามีให้แทนที่ (Update) ถ้าไม่มีให้เพิ่ม (Add)
      const index = state.ratings.findIndex(
        (r) =>
          r.orderId === action.payload.orderId &&
          r.productId === action.payload.productId
      );
      if (index !== -1) {
        state.ratings[index] = action.payload;
      } else {
        state.ratings.push(action.payload);
      }
    },
  },
});

export const { setUserRatings, addRating } = ratingSlice.actions;
export default ratingSlice.reducer;
