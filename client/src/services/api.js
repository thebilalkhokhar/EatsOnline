import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000",
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add multipart/form-data header if the data is FormData
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Response error:", error);
    if (error.response?.status === 401) {
      sessionStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const signup = (data) => api.post("/api/auth/signup", data);
export const login = (data) => api.post("/api/auth/login", data);
export const getProfile = () => api.get("/api/auth/profile");

// Cart
export const getCart = () => api.get("/api/cart");
export const updateCart = (data) => api.post("/api/cart", data);
export const removeFromCart = (productId) =>
  api.delete(`/api/cart/${productId}`);
export const clearCart = () => api.delete("/api/cart");

// Orders
export const getOrders = (userId, role) =>
  api.get("/api/orders", {
    params: role === "admin" ? { restaurantId: userId } : { createdBy: userId },
  });
export const getOrderDetails = (orderId, token) =>
  api.get(`/api/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
export const updateOrderStatus = (orderId, data) =>
  api.put(`/api/orders/${orderId}`, data);
export const placeOrder = (data) => api.post("/api/orders", data);

// Products
export const getProducts = (restaurantId = null) =>
  api.get("/api/products", restaurantId ? { params: { restaurantId } } : undefined);
export const addProduct = (data) => api.post("/api/products", data);
export const updateProduct = (productId, data) =>
  api.put(`/api/products/${productId}`, data);
export const deleteProduct = (productId) =>
  api.delete(`/api/products/${productId}`);

// Categories
export const getCategories = (restaurantId) =>
  api.get("/api/categories", { params: { restaurantId } });
export const addCategory = (data) => api.post("/api/categories", data);
export const updateCategory = (categoryId, data) =>
  api.put(`/api/categories/${categoryId}`, data);
export const deleteCategory = (categoryId) =>
  api.delete(`/api/categories/${categoryId}`);

// Admin
export const getAdminOrders = (token, restaurantId) =>
  api.get("/api/admin/orders", { params: { restaurantId } });
export const getSalesReport = (params = {}) =>
  api.get("/api/admin/reports/sales", { params });

// Restaurants
export const getRestaurants = () => api.get("/api/restaurants");
export const createRestaurant = (formData) => {
  return api.post("/api/restaurants", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const updateRestaurant = (restaurantId, formData) => {
  return api.put(`/api/restaurants/${restaurantId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const getRestaurantDetails = (restaurantId) =>
  api.get(`/api/restaurants/${restaurantId}`);

// Reviews
export const getReviews = () => api.get("/api/reviews");
export const createReview = (data) => api.post("/api/reviews", data);
export const getReviewByOrder = (orderId) => api.get(`/api/reviews/order/${orderId}`);
