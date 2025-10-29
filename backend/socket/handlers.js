import jwt from 'jsonwebtoken';
import Timeline from '../models/Timeline.js';
import User from '../models/User.js';
import { notifyTimelineMembers } from '../services/notifications.js';

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

    socket.on('event-added', async (data) => {
      socket.to(`timeline-${data.timelineId}`).emit('event-added', data);
      
      // Send push notification
      try {
        const sender = await User.findById(socket.userId);
        if (sender) {
          await notifyTimelineMembers(
            data.timelineId,
            socket.userId,
            {
              title: `${sender.name} added a new event`,
              body: data.event?.title || 'New event added to timeline'
            },
            {
              type: 'event-added',
              url: `/timeline/${data.timelineId}`
            }
          );
        }
      } catch (error) {
        console.error('Error sending event-added notification:', error);
      }
    });

    socket.on('event-updated', async (data) => {
      socket.to(`timeline-${data.timelineId}`).emit('event-updated', data);
      
      // Send push notification
      try {
        const sender = await User.findById(socket.userId);
        if (sender) {
          const isCompleted = data.event?.isCompleted;
          await notifyTimelineMembers(
            data.timelineId,
            socket.userId,
            {
              title: isCompleted 
                ? `${sender.name} completed an event` 
                : `${sender.name} updated an event`,
              body: data.event?.title || 'Event updated'
            },
            {
              type: 'event-updated',
              url: `/timeline/${data.timelineId}`
            }
          );
        }
      } catch (error) {
        console.error('Error sending event-updated notification:', error);
      }
    });

    socket.on('note-added', (data) => {
      socket.to(`timeline-${data.timelineId}`).emit('note-added', data);
    });

    socket.on('message-sent', async (data) => {
      // Broadcast to all users in the timeline room
      io.to(`timeline-${data.timelineId}`).emit('message-received', data);
      
      // Send push notification to timeline members
      try {
        const sender = await User.findById(socket.userId);
        const timeline = await Timeline.findById(data.timelineId);
        
        if (sender && timeline) {
          await notifyTimelineMembers(
            data.timelineId,
            socket.userId,
            {
              title: `${sender.name} sent a message`,
              body: data.message || 'New message in timeline'
            },
            {
              type: 'message',
              url: `/timeline/${data.timelineId}`
            }
          );
        }
      } catch (error) {
        console.error('Error sending message notification:', error);
      }
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
