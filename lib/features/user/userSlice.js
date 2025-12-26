import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  role: "user",
  name: null,   // ✅ เพิ่มตัวแปร name
  avatar: null, // ✅ เพิ่มตัวแปร avatar
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // เปลี่ยนจาก setRole เป็น setUserData เพื่อเก็บข้อมูลครบชุด
    setUserData: (state, action) => {
      state.role = action.payload.role;
      state.name = action.payload.name;
      state.avatar = action.payload.avatar;
    },
    // (Optional) เก็บ setRole ไว้กันโค้ดเก่าพัง แต่แนะนำให้ใช้ setUserData แทน
    setRole: (state, action) => {
      state.role = action.payload;
    },
  },
});

export const { setUserData, setRole } = userSlice.actions;
export default userSlice.reducer;