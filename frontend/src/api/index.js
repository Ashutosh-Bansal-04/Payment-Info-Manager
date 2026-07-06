import axiosClient from './axiosClient';

// ===================== Auth =====================

export const registerUser = (data) =>
  axiosClient.post('/auth/register', data);

export const loginUser = (data) =>
  axiosClient.post('/auth/login', data);

// ===================== Payments (user) =====================

export const getMyPayments = () =>
  axiosClient.get('/payments');

export const addPayment = (data) =>
  axiosClient.post('/payments', data);

export const updatePayment = (id, data) =>
  axiosClient.put(`/payments/${id}`, data);

export const deletePayment = (id) =>
  axiosClient.delete(`/payments/${id}`);

// ===================== Admin =====================

export const getAdminPayments = (params = {}) =>
  axiosClient.get('/admin/payments', { params });
