import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: any;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  refreshToken: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  refreshToken: null,
};

// Define las acciones que tendremos
interface LoginPayload {
  user: any;
  token: string;
  refreshToken: string;
}

interface RegisterPayload {
  user: any;
  token: string;
  refreshToken: string;
}

interface AuthErrorPayload {
  error: string;
}

interface LogoutPayload {
  // No payload needed
}

interface RefreshTokenPayload {
  token: string;
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<LoginPayload>) => {
      state.loading = true;
      state.error = null;

      // When login action is dispatched with payload
      if (action.payload) {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.loading = false;
      }

      // Save to localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', action.payload.token || '');
        localStorage.setItem('refreshToken', action.payload.refreshToken || '');
        localStorage.setItem('user', JSON.stringify(action.payload.user || {}));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    },
    refreshToken: (state, action: PayloadAction<RefreshTokenPayload>) => {
      state.token = action.payload.token;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<AuthErrorPayload>) => {
      state.loading = false;
      state.error = action.payload.error;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Initialize auth state from localStorage
    initializeAuth: (state) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const userStr = localStorage.getItem('user');

        if (token && refreshToken && userStr) {
          try {
            state.token = token;
            state.refreshToken = refreshToken;
            state.user = JSON.parse(userStr);
            state.isAuthenticated = true;
          } catch (error) {
            console.error('Failed to parse user data from localStorage', error);
          }
        }
      }
    },
  },
});

export const {
  login,
  logout,
  refreshToken,
  setLoading,
  setError,
  clearError,
  initializeAuth,
} = authSlice.actions;

export default authSlice.reducer;