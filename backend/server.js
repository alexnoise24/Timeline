import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import timelineRoutes from './routes/timeline.js';
import userRoutes from './routes/user.js';
import invitationRoutes from './routes/invitations.js';
import { setupSocketHandlers } from './socket/handlers.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
// Allow any origin in development (echo request origin) to avoid dev port issues
const isProd = process.env.NODE_ENV === 'production';

const io = new Server(httpServer, {
  cors: {
    origin: isProd ? process.env.FRONTEND_URL : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

// Middleware
app.use(cors({
  origin: isProd ? process.env.FRONTEND_URL : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 60000,
  maxPoolSize: 10,
  minPoolSize: 2,
})
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error conectando a MongoDB:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/timelines', timelineRoutes);
app.use('/api/users', userRoutes);
app.use('/api/invitations', invitationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Socket.io setup
setupSocketHandlers(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Algo salió mal!', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 Frontend URL: http://localhost:5173`);
  console.log(`🔌 Socket.io listo para conexiones`);
});

export { io };
