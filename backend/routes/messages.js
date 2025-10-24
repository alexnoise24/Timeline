import express from 'express';
import Message from '../models/Message.js';
import Timeline from '../models/Timeline.js';
import { authenticate, requireTimelineAccess } from '../middleware/auth.js';

const router = express.Router();

// Get all conversations (timelines with messages) for the current user
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all timelines the user has access to
    const ownedTimelines = await Timeline.find({ owner: userId }).select('_id title weddingDate');
    
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    const invitedTimelineIds = user.invitedTimelines
      .filter(inv => inv.status === 'accepted')
      .map(inv => inv.timelineId);

    const allTimelineIds = [
      ...ownedTimelines.map(t => t._id),
      ...invitedTimelineIds
    ];

    // Get the last message for each timeline
    const conversations = await Promise.all(
      allTimelineIds.map(async (timelineId) => {
        const timeline = await Timeline.findById(timelineId)
          .select('title weddingDate couple')
          .populate('owner', 'name');
        
        if (!timeline) return null;

        const lastMessage = await Message.findOne({ timelineId })
          .sort({ createdAt: -1 })
          .populate('sender', 'name avatar');

        const unreadCount = await Message.countDocuments({
          timelineId,
          'readBy.user': { $ne: userId }
        });

        return {
          timeline: {
            _id: timeline._id,
            title: timeline.title,
            couple: timeline.couple,
            weddingDate: timeline.weddingDate,
            owner: timeline.owner
          },
          lastMessage,
          unreadCount
        };
      })
    );

    // Filter out null results and sort by last message time
    const validConversations = conversations
      .filter(c => c !== null)
      .sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || 0;
        const bTime = b.lastMessage?.createdAt || 0;
        return new Date(bTime) - new Date(aTime);
      });

    res.json({ conversations: validConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific timeline
router.get('/:timelineId', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const { timelineId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before; // For pagination

    const query = { timelineId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name email avatar')
      .populate('readBy.user', 'name');

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Send a message to a timeline
router.post('/:timelineId', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const { timelineId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = new Message({
      timelineId,
      sender: req.userId,
      content: content.trim(),
      readBy: [{ user: req.userId }] // Mark as read by sender
    });

    await message.save();
    await message.populate('sender', 'name email avatar');

    res.status(201).json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Mark messages as read
router.put('/:timelineId/read', authenticate, requireTimelineAccess, async (req, res) => {
  try {
    const { timelineId } = req.params;
    const userId = req.userId;

    // Mark all unread messages in this timeline as read
    await Message.updateMany(
      {
        timelineId,
        'readBy.user': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
});

export default router;
