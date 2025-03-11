import mongoose from 'mongoose';

let isConnected = false;

export const connectToDatabase = async (uri: string): Promise<void> => {
  if (isConnected) {
    console.log('=> using existing database connection');
    return;
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log('=> using new database connection');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

export const disconnectFromDatabase = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('=> disconnected from database');
  } catch (error) {
    console.error('Database disconnection error:', error);
    throw error;
  }
};