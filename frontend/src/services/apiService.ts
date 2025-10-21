import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Create a custom axios instance for the backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token, Authorization',
      },
    });

    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token && config.headers) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for handling errors
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh or logout
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.axiosInstance.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const response = await this.axiosInstance.post('/auth/register', userData);
    return response.data;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.axiosInstance.post('/auth/refresh', {}, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Handle refresh token cookie if returned
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }

    return response.data;
  }

  async logout() {
    const response = await this.axiosInstance.post('/auth/logout', {});

    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.axiosInstance.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  // Profile endpoints
  async getProfile() {
    const response = await this.axiosInstance.get('/auth/profile');
    return response.data;
  }

  async updateProfile(userData: any) {
    const response = await this.axiosInstance.put('/auth/profile', userData);
    return response.data;
  }

  async forgotPassword(email: string) {
    const response = await this.axiosInstance.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, password: string) {
    const response = await this.axiosInstance.post('/auth/reset-password', {
      token,
      password,
    });
    return response.data;
  }

  // Orders endpoints
  async getOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const response = await this.axiosInstance.get('/orders', { params });
    return response.data;
  }

  async getOrder(id: string) {
    const response = await this.axiosInstance.get(`/orders/${id}`);
    return response.data;
  }

  async createOrder(orderData: any) {
    const response = await this.axiosInstance.post('/orders', orderData);
    return response.data;
  }

  async updateOrder(id: string, orderData: any) {
    const response = await this.axiosInstance.put(`/orders/${id}`, orderData);
    return response.data;
  }

  async cancelOrder(id: string, cancellationReason: string) {
    const response = await this.axiosInstance.put(`/orders/${id}/cancel`, {
      cancellationReason,
    });
    return response.data;
  }

  // Services endpoints
  async getServices(params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    workArea?: string;
    minPrice?: number;
    maxPrice?: number;
    technicianId?: string;
  }) {
    const response = await this.axiosInstance.get('/services', { params });
    return response.data;
  }

  async getService(id: string) {
    const response = await this.axiosInstance.get(`/services/${id}`);
    return response.data;
  }

  async createService(serviceData: any) {
    const response = await this.axiosInstance.post('/services', serviceData);
    return response.data;
  }

  async updateService(id: string, serviceData: any) {
    const response = await this.axiosInstance.put(`/services/${id}`, serviceData);
    return response.data;
  }

  async deleteService(id: string) {
    const response = await this.axiosInstance.delete(`/services/${id}`);
    return response.data;
  }

  // Users endpoints
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) {
    const response = await this.axiosInstance.get('/users', { params });
    return response.data;
  }

  async getUser(id: string) {
    const response = await this.axiosInstance.get(`/users/${id}`);
    return response.data;
  }

  async updateUser(id: string, userData: any) {
    const response = await this.axiosInstance.put(`/users/${id}`, userData);
    return response.data;
  }
}

export default new ApiService();