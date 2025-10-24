import jwt from 'jsonwebtoken';
import Timeline from '../models/Timeline.js';

export const setupSocketHandlers = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.userId}`);

    socket.on('join-timeline', (timelineId) => {
      socket.join(`timeline-${timelineId}`);
    });

    socket.on('leave-timeline', (timelineId) => {
      socket.leave(`timeline-${timelineId}`);
    });

    socket.on('timeline-update', (data) => {
      socket.to(`timeline-${data.timelineId}`).emit('timeline-updated', data);
    });

    socket.on('event-added', (data) => {
      socket.to(`timeline-${data.timelineId}`).emit('event-added', data);
    });

    socket.on('event-updated', (data) => {
      socket.to(`timeline-${data.timelineId}`).emit('event-updated', data);
    });

    socket.on('note-added', (data) => {
      socket.to(`timeline-${data.timelineId}`).emit('note-added', data);
    });

    socket.on('message-sent', (data) => {
      // Broadcast to all users in the timeline room
      io.to(`timeline-${data.timelineId}`).emit('message-received', data);
    });

    socket.on('typing', (data) => {
      socket.to(`timeline-${data.timelineId}`).emit('user-typing', {
        userId: socket.userId,
        timelineId: data.timelineId
      });
    });

    socket.on('disconnect', () => {
      console.log(`Usuario desconectado: ${socket.userId}`);
    });
  });
};
