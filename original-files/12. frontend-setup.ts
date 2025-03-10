// apps/frontend/package.json
{
  "name": "@booking-platform/frontend",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@booking-platform/utils": "*",
    "@headlessui/react": "^1.7.15",
    "@heroicons/react": "^2.0.18",
    "@hookform/resolvers": "^3.1.1",
    "@stripe/react-stripe-js": "^2.1.1",
    "@stripe/stripe-js": "^1.54.1",
    "axios": "^1.4.0",
    "date-fns": "^2.30.0",
    "firebase": "^9.23.0",
    "next": "13.4.7",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-hook-form": "^7.45.1",
    "react-query": "^3.39.3",
    "yup": "^1.2.0"
  },
  "devDependencies": {
    "@booking-platform/eslint-config": "*",
    "@booking-platform/typescript-config": "*",
    "@types/node": "^18.16.16",
    "@types/react": "^18.2.12",
    "@types/react-dom": "^18.2.5",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.42.0",
    "postcss": "^8.4.24",
    "tailwindcss": "^3.3.2",
    "typescript": "^5.1.3"
  }
}

// apps/frontend/tsconfig.json
{
  "extends": "@booking-platform/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

// apps/frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@booking-platform/utils"]
}

module.exports = nextConfig

// apps/frontend/postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

// apps/frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
    },
  },
  plugins: [],
}

// apps/frontend/.env.example
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

// apps/frontend/src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

export default app;

// apps/frontend/src/lib/api.ts
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
