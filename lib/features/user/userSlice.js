import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  role: "user", // default
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setRole(state, action) {
      state.role = action.payload;
    },
    clearRole(state) {
      state.role = "user";
    },
  },
});

export const { setRole, clearRole } = userSlice.actions;
export default userSlice.reducer;
