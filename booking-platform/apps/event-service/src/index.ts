import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectToDatabase } from '@booking-platform/database';

// Load environment variables
dotenv.config();

// Import routes
import eventRoutes from './routes/event.routes';
import spaceRoutes from './routes/space.routes';

// Initialize Express app
const app = express();
const port = process.env.PORT || 4002;

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'event-service' });
});

// Register routes
app.use('/api', eventRoutes);
app.use('/api', spaceRoutes);

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

// Connect to database and start the server
const startServer = async () => {
  try {
    await connectToDatabase(process.env.MONGODB_URI as string);
    app.listen(port, () => {
      console.log(`Event Service running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();