import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null, // เริ่มต้นเป็น null (ยังไม่ได้ Login)
  loading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // ใช้สำหรับเซ็ตข้อมูล User เมื่อ Login สำเร็จ หรือโหลดหน้าเว็บใหม่
    setUser: (state, action) => {
      state.user = action.payload;
      state.loading = false;
    },
    // ใช้สำหรับ Logout
    clearUser: (state) => {
      state.user = null;
      state.loading = false;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
