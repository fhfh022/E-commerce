import Cookies from 'js-cookie';

// เก็บข้อมูลลง Cookie (หมดอายุใน 7 วัน)
export const setCookie = (name, value, days = 7) => {
  Cookies.set(name, value, { 
    expires: days, 
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' 
  });
};

// ดึงข้อมูลจาก Cookie
export const getCookie = (name) => {
  return Cookies.get(name);
};

// ลบ Cookie
export const removeCookie = (name) => {
  Cookies.remove(name);
};