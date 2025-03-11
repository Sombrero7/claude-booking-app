import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Load environment variables
dotenv.config();

// Import middleware
import { authenticateUser } from './middleware/auth';

// Initialize Express app
const app = express();
const port = process.env.PORT || 4000;

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// Setup service proxies
const userServiceProxy = createProxyMiddleware({
  target: process.env.USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/users': '/api' }
});

const eventServiceProxy = createProxyMiddleware({
  target: process.env.EVENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/events': '/api' },
  pathRewrite: { '^/api/spaces': '/api' }
});

const bookingServiceProxy = createProxyMiddleware({
  target: process.env.BOOKING_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/bookings': '/api' },
  pathRewrite: { '^/api/requests': '/api' }
});

const paymentServiceProxy = createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/payments': '/api' }
});

// Authenticate all API routes
app.use('/api', authenticateUser);

// Set up proxy routes
app.use('/api/users', userServiceProxy);
app.use('/api/events', eventServiceProxy);
app.use('/api/spaces', eventServiceProxy);
app.use('/api/bookings', bookingServiceProxy);
app.use('/api/requests', bookingServiceProxy);
app.use('/api/payments', paymentServiceProxy);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});