// Acciones asíncronas para el auth slice
import { createAction } from '@reduxjs/toolkit';

export const loginUser = createAction<{ email: string; password: string }>(
  'auth/login',
  ({ email, password }) => ({
    payload: { email, password },
  }),
);

export const registerUser = createAction<{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}>(
  'auth/register',
  ({ email, password, firstName, lastName, phone }) => ({
    payload: { email, password, firstName, lastName, phone },
  }),
);

export const logout = createAction('auth/logout');

export const refreshToken = createAction('auth/refreshToken');

export const clearAuthError = createAction('auth/clearError');

export const initializeAuth = createAction('auth/initializeAuth');

// Acciones para manejo de loading
export const setAuthLoading = createAction<boolean>('auth/setLoading');

export const setAuthError = createAction<string>('auth/setError');