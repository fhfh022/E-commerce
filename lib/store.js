import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './features/cart/cartSlice'
import productReducer from './features/product/productSlice'
import addressReducer from './features/address/addressSlice'
import ratingReducer from './features/rating/ratingSlice'
import userReducer from './features/user/userSlice'
import favoriteReducer from './features/favorite/favoriteSlice'
import authReducer from './features/auth/authSlice'

export const makeStore = () => {
    return configureStore({
        reducer: {
            cart: cartReducer,
            product: productReducer,
            address: addressReducer,
            rating: ratingReducer,
            user: userReducer,
            favorite: favoriteReducer,
            auth: authReducer,

        },
    })
}