const mongoose = require('mongoose');
let memoryServer;

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