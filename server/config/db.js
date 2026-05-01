const mongoose = require('mongoose');
let memoryServer;

/**
 * Resolves the MongoDB connection URI.
 * If a MONGODB_URI is provided in the .env file, it uses that (intended for production).
 * If no URI is provided, it spins up an ephemeral, in-memory MongoDB instance 
 * using mongodb-memory-server (intended for quick local preview without setting up a DB).
 */
const resolveMongoUri = async () => {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  if (!memoryServer) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    console.warn('MONGODB_URI not provided. Using ephemeral in-memory MongoDB instance.');
  }

  return memoryServer.getUri();
};

/**
 * Connects to the MongoDB database using Mongoose.
 */
const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    const uri = await resolveMongoUri();
    const conn = await mongoose.connect(uri, { family: 4 });
    console.log(`Database Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Failed to initialize database connection', error);
    throw error;
  }
};

module.exports = connectDB;