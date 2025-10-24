import { create } from 'zustand';
import { Message, Conversation } from '@/types';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';

interface MessageState {
  conversations: Conversation[];
  messages: { [timelineId: string]: Message[] };
  activeConversation: string | null;
  isLoading: boolean;
  fetchConversations: () => Promise<void>;
  fetchMessages: (timelineId: string) => Promise<void>;
  sendMessage: (timelineId: string, content: string) => Promise<void>;
  markAsRead: (timelineId: string) => Promise<void>;
  setActiveConversation: (timelineId: string | null) => void;
  addMessage: (message: Message) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  messages: {},
  activeConversation: null,
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/messages/conversations');
      set({ conversations: data.conversations });
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (timelineId: string) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/messages/${timelineId}`);
      set((state) => ({
        messages: {
          ...state.messages,
          [timelineId]: data.messages
        }
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (timelineId: string, content: string) => {
    try {
      const { data } = await api.post(`/messages/${timelineId}`, { content });
      
      // Add message to local state
      set((state) => ({
        messages: {
          ...state.messages,
          [timelineId]: [...(state.messages[timelineId] || []), data.message]
        }
      }));

      // Emit socket event
      const socket = getSocket();
      socket?.emit('message-sent', {
        timelineId,
        message: data.message
      });

      // Refresh conversations to update last message
      get().fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  markAsRead: async (timelineId: string) => {
    try {
      await api.put(`/messages/${timelineId}/read`);
      
      // Update conversation unread count
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.timeline._id === timelineId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  },

  setActiveConversation: (timelineId: string | null) => {
    set({ activeConversation: timelineId });
    if (timelineId) {
      get().markAsRead(timelineId);
    }
  },

  addMessage: (message: Message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [message.timelineId]: [
          ...(state.messages[message.timelineId] || []),
          message
        ]
      }
    }));

    // Refresh conversations to update last message
    get().fetchConversations();
  }
}));
