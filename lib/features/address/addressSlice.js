import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    list: [],
    selectedId: null
}

export const addressSlice = createSlice({
    name: 'address',
    initialState,
    reducers: {
        setAddresses: (state, action) => {
            state.list = action.payload;
        },
        addAddress: (state, action) => {
            state.list.unshift(action.payload); // เพิ่มตัวใหม่ไว้บนสุด
        },
        // ✅ เพิ่ม: อัปเดตข้อมูลที่อยู่
        updateAddress: (state, action) => {
            const index = state.list.findIndex(addr => addr.id === action.payload.id);
            if (index !== -1) {
                state.list[index] = action.payload;
            }
        },
        // ✅ เพิ่ม: ลบที่อยู่
        deleteAddress: (state, action) => {
            state.list = state.list.filter(addr => addr.id !== action.payload);
        }
    }
})

export const { setAddresses, addAddress, updateAddress, deleteAddress } = addressSlice.actions
export default addressSlice.reducer