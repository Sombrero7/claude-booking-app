import axios from 'axios';
import { auth } from './firebase';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors (401)
    if (error.response && error.response.status === 401) {
      // Redirect to login page or refresh token
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// User API calls
export const userAPI = {
  createUser: (data: any) => api.post('/users', data),
  getCurrentUser: () => api.get('/users/me'),
  updateUser: (data: any) => api.put('/users/me', data),
  followUser: (userId: string) => api.post(`/users/${userId}/follow`),
  unfollowUser: (userId: string) => api.delete(`/users/${userId}/follow`),
  getUserFollowers: (userId: string) => api.get(`/users/${userId}/followers`),
  getUserFollowing: (userId: string) => api.get(`/users/${userId}/following`),
};

// Event API calls
export const eventAPI = {
  createEvent: (data: any) => api.post('/events', data),
  getEvents: (params?: any) => api.get('/events', { params }),
  getMyEvents: () => api.get('/events/me'),
  getEventById: (id: string) => api.get(`/events/${id}`),
  updateEvent: (id: string, data: any) => api.put(`/events/${id}`, data),
  deleteEvent: (id: string) => api.delete(`/events/${id}`),
  addCollaborator: (id: string, data: any) => api.post(`/events/${id}/collaborators`, data),
  removeCollaborator: (id: string, collaboratorId: string) => 
    api.delete(`/events/${id}/collaborators/${collaboratorId}`),
  getEventOccurrences: (id: string) => api.get(`/events/${id}/occurrences`),
};

// Space API calls
export const spaceAPI = {
  createSpace: (data: any) => api.post('/spaces', data),
  getSpaces: (params?: any) => api.get('/spaces', { params }),
  getMySpaces: () => api.get('/spaces/me'),
  getSpaceById: (id: string) => api.get(`/spaces/${id}`),
  updateSpace: (id: string, data: any) => api.put(`/spaces/${id}`, data),
  deleteSpace: (id: string) => api.delete(`/spaces/${id}`),
  checkSpaceAvailability: (id: string, params: any) => 
    api.get(`/spaces/${id}/availability`, { params }),
};

// Booking API calls
export const bookingAPI = {
  createBooking: (data: any) => api.post('/bookings', data),
  getMyBookings: (params?: any) => api.get('/bookings/me', { params }),
  getBookingById: (id: string) => api.get(`/bookings/${id}`),
  updateBookingStatus: (id: string, data: any) => api.put(`/bookings/${id}/status`, data),
  getEventBookings: (eventId: string, params?: any) => 
    api.get(`/events/${eventId}/bookings`, { params }),
};

// Request API calls
export const requestAPI = {
  createRequest: (data: any) => api.post('/requests', data),
  getMyRequests: (params?: any) => api.get('/requests/me', { params }),
  getCreatorRequests: (params?: any) => api.get('/requests/creator', { params }),
  getVenueRequests: (params?: any) => api.get('/requests/venue', { params }),
  getRequestById: (id: string) => api.get(`/requests/${id}`),
  updateRequestApproval: (id: string, data: any) => api.put(`/requests/${id}/approval`, data),
};

// Payment API calls
export const paymentAPI = {
  initiatePayment: (data: any) => api.post('/payments/initiate', data),
  confirmPayment: (data: any) => api.post('/payments/confirm', data),
  processRefund: (data: any) => api.post('/payments/refund', data),
  getUserTransactions: () => api.get('/payments/transactions'),
  setupStripeAccount: (data: any) => api.post('/payments/setup-stripe', data),
};