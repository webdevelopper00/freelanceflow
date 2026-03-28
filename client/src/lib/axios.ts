import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 10000,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthCheck = originalRequest?.url?.includes('/api/auth/me');
    const isRefreshRequest = originalRequest?.url?.includes('/api/auth/refresh');

    if (error.response?.status === 401 && !isAuthCheck && !isRefreshRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axiosInstance.post('/api/auth/refresh', undefined, { withCredentials: true });
        return axiosInstance.request(originalRequest);
      } catch {
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    if (error.response?.status === 401 && !isAuthCheck) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
