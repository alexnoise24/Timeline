import { create } from 'zustand';
import { Timeline, Event } from '@/types';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';

interface TimelineState {
  timelines: Timeline[];
  currentTimeline: Timeline | null;
  isLoading: boolean;
  fetchTimelines: () => Promise<void>;
  fetchTimeline: (id: string) => Promise<void>;
  createTimeline: (data: Partial<Timeline>) => Promise<Timeline>;
  updateTimeline: (id: string, data: Partial<Timeline>) => Promise<void>;
  deleteTimeline: (id: string) => Promise<void>;
  addEvent: (timelineId: string, event: Partial<Event>) => Promise<void>;
  updateEvent: (timelineId: string, eventId: string, data: Partial<Event>) => Promise<void>;
  addNote: (timelineId: string, eventId: string, content: string) => Promise<void>;
  addCollaborator: (timelineId: string, userId: string, role: string) => Promise<void>;
  joinTimelineRoom: (timelineId: string) => void;
  leaveTimelineRoom: (timelineId: string) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  timelines: [],
  currentTimeline: null,
  isLoading: false,

  fetchTimelines: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/timelines');
      set({ timelines: data.timelines });
    } catch (error) {
      console.error('Error fetching timelines:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTimeline: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/timelines/${id}`);
      set({ currentTimeline: data.timeline });
      get().joinTimelineRoom(id);
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createTimeline: async (timelineData) => {
    const { data } = await api.post('/timelines', timelineData);
    set((state) => ({ timelines: [data.timeline, ...state.timelines] }));
    return data.timeline;
  },

  updateTimeline: async (id, timelineData) => {
    const { data } = await api.put(`/timelines/${id}`, timelineData);
    set((state) => ({
      timelines: state.timelines.map((t) => (t._id === id ? data.timeline : t)),
      currentTimeline: state.currentTimeline?._id === id ? data.timeline : state.currentTimeline,
    }));
    
    const socket = getSocket();
    socket?.emit('timeline-update', { timelineId: id, timeline: data.timeline });
  },

  deleteTimeline: async (id) => {
    await api.delete(`/timelines/${id}`);
    set((state) => ({
      timelines: state.timelines.filter((t) => t._id !== id),
      currentTimeline: state.currentTimeline?._id === id ? null : state.currentTimeline,
    }));
    
    const socket = getSocket();
    socket?.emit('timeline-deleted', { timelineId: id });
  },

  addEvent: async (timelineId, eventData) => {
    const { data } = await api.post(`/timelines/${timelineId}/events`, eventData);
    set((state) => ({
      currentTimeline: state.currentTimeline
        ? { ...state.currentTimeline, events: [...state.currentTimeline.events, data.event] }
        : null,
    }));

    const socket = getSocket();
    socket?.emit('event-added', { timelineId, event: data.event });
  },

  updateEvent: async (timelineId, eventId, eventData) => {
    const { data } = await api.put(`/timelines/${timelineId}/events/${eventId}`, eventData);
    set((state) => ({
      currentTimeline: state.currentTimeline
        ? {
            ...state.currentTimeline,
            events: state.currentTimeline.events.map((e) =>
              e._id === eventId ? data.event : e
            ),
          }
        : null,
    }));

    const socket = getSocket();
    socket?.emit('event-updated', { timelineId, event: data.event });
  },

  addNote: async (timelineId, eventId, content) => {
    const { data } = await api.post(`/timelines/${timelineId}/events/${eventId}/notes`, {
      content,
    });
    set((state) => ({
      currentTimeline: state.currentTimeline
        ? {
            ...state.currentTimeline,
            events: state.currentTimeline.events.map((e) =>
              e._id === eventId ? { ...e, notes: [...e.notes, data.note] } : e
            ),
          }
        : null,
    }));

    const socket = getSocket();
    socket?.emit('note-added', { timelineId, eventId, note: data.note });
  },

  addCollaborator: async (timelineId, userId, role) => {
    await api.post(`/timelines/${timelineId}/collaborators`, { userId, role });
    await get().fetchTimeline(timelineId);
  },

  joinTimelineRoom: (timelineId) => {
    const socket = getSocket();
    socket?.emit('join-timeline', timelineId);
  },

  leaveTimelineRoom: (timelineId) => {
    const socket = getSocket();
    socket?.emit('leave-timeline', timelineId);
  },
}));
