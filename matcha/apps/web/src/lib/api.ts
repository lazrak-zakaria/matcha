
import axios from "axios";

export const access_token = "token";

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002"}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  let token = null;
  if (typeof window !== "undefined" )
    if (localStorage.getItem('auth-storage')) {
      token = localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')!).state?.token : null;
    }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       if (typeof window !== "undefined") {
//         localStorage.removeItem(access_token);
//       }
//       const path = window.location.pathname;
//       if (path !== "/login" && path !== "/register") {
//           window.location.href = "/login";
//       }
//     }
//     return Promise.reject(error);
//   }
// );

export default api;
