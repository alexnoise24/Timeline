import { create } from 'zustand';
import { Timeline, Event, Shot, InspirationImage } from '@/types';
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
  deleteEvent: (timelineId: string, eventId: string) => Promise<void>;
  toggleEventCompletion: (timelineId: string, eventId: string) => Promise<void>;
  addNote: (timelineId: string, eventId: string, content: string) => Promise<void>;
  // Day management
  addDay: (timelineId: string, day: { date: string; label?: string }) => Promise<void>;
  updateDay: (timelineId: string, dayId: string, data: { date?: string; label?: string }) => Promise<void>;
  deleteDay: (timelineId: string, dayId: string) => Promise<void>;
  // Day event management
  addDayEvent: (timelineId: string, dayId: string, event: Partial<Event>) => Promise<void>;
  updateDayEvent: (timelineId: string, dayId: string, eventId: string, data: Partial<Event>) => Promise<void>;
  deleteDayEvent: (timelineId: string, dayId: string, eventId: string) => Promise<void>;
  toggleDayEventCompletion: (timelineId: string, dayId: string, eventId: string) => Promise<void>;
  addDayEventNote: (timelineId: string, dayId: string, eventId: string, content: string) => Promise<void>;
  addCollaborator: (timelineId: string, userId: string, role: string) => Promise<void>;
  removeCollaborator: (timelineId: string, userId: string) => Promise<void>;
  addShot: (timelineId: string, shot: Partial<Shot>) => Promise<void>;
  updateShot: (timelineId: string, shotId: string, data: Partial<Shot>) => Promise<void>;
  deleteShot: (timelineId: string, shotId: string) => Promise<void>;
  uploadInspiration: (timelineId: string, file: File) => Promise<InspirationImage>;
  updateInspirationNotes: (timelineId: string, imageId: string, notes: string) => Promise<void>;
  deleteInspiration: (timelineId: string, imageId: string) => Promise<void>;
  updateOverview: (timelineId: string, data: Partial<Timeline>) => Promise<void>;
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

  deleteEvent: async (timelineId, eventId) => {
    await api.delete(`/timelines/${timelineId}/events/${eventId}`);
    set((state) => ({
      currentTimeline: state.currentTimeline
        ? {
            ...state.currentTimeline,
            events: state.currentTimeline.events.filter((e) => e._id !== eventId),
          }
        : null,
    }));

    const socket = getSocket();
    socket?.emit('event-deleted', { timelineId, eventId });
  },

  toggleEventCompletion: async (timelineId, eventId) => {
    const { data } = await api.patch(`/timelines/${timelineId}/events/${eventId}/complete`);
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

  removeCollaborator: async (timelineId, userId) => {
    await api.delete(`/timelines/${timelineId}/collaborators/${userId}`);
    await get().fetchTimeline(timelineId);
  },

  addShot: async (timelineId, shotData) => {
    const { data } = await api.post(`/timelines/${timelineId}/shots`, shotData);
    set((state) => ({
      currentTimeline: state.currentTimeline
        ? { ...state.currentTimeline, shotList: [...state.currentTimeline.shotList, data.shot] }
        : null,
    }));

    const socket = getSocket();
    socket?.emit('shot-added', { timelineId, shot: data.shot });
  },

  updateShot: async (timelineId, shotId, shotData) => {
    const { data } = await api.put(`/timelines/${timelineId}/shots/${shotId}`, shotData);
    set((state) => ({
      currentTimeline: state.currentTimeline
        ? {
            ...state.currentTimeline,
            shotList: state.currentTimeline.shotList.map((s) =>
              s._id === shotId ? data.shot : s
            ),
          }
        : null,
    }));

    const socket = getSocket();
    socket?.emit('shot-updated', { timelineId, shot: data.shot });
  },

  deleteShot: async (timelineId, shotId) => {
    await api.delete(`/timelines/${timelineId}/shots/${shotId}`);
    set((state) => ({
      currentTimeline: state.currentTimeline
        ? {
            ...state.currentTimeline,
            shotList: state.currentTimeline.shotList.filter((s) => s._id !== shotId),
          }
        : null,
    }));

    const socket = getSocket();
    socket?.emit('shot-deleted', { timelineId, shotId });
  },

  uploadInspiration: async (timelineId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await api.post(`/timelines/${timelineId}/inspiration/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    set((state) => ({
      currentTimeline: state.currentTimeline
        ? { 
            ...state.currentTimeline, 
            inspiration: [...(state.currentTimeline.inspiration || []), data.image] 
          }
        : null,
    }));

    const socket = getSocket();
    socket?.emit('inspiration-added', { timelineId, image: data.image });
    return data.image;
  },

  updateInspirationNotes: async (timelineId, imageId, notes) => {
    const { data } = await api.put(`/timelines/${timelineId}/inspiration/${imageId}`, { notes });
    set((state) => ({
      currentTimeline: state.currentTimeline
        ? {
            ...state.currentTimeline,
            inspiration: (state.currentTimeline.inspiration || []).map((i) =>
              i._id === imageId ? data.image : i
            ),
          }
        : null,
    }));

    const socket = getSocket();
    socket?.emit('inspiration-updated', { timelineId, image: data.image });
  },

  deleteInspiration: async (timelineId, imageId) => {
    await api.delete(`/timelines/${timelineId}/inspiration/${imageId}`);
    set((state) => ({
      currentTimeline: state.currentTimeline
        ? {
            ...state.currentTimeline,
            inspiration: (state.currentTimeline.inspiration || []).filter((i) => i._id !== imageId),
          }
        : null,
    }));

    const socket = getSocket();
    socket?.emit('inspiration-deleted', { timelineId, imageId });
  },

  updateOverview: async (timelineId, overviewData) => {
    const { data } = await api.put(`/timelines/${timelineId}`, overviewData);
    set((state) => ({
      currentTimeline: state.currentTimeline?._id === timelineId ? data.timeline : state.currentTimeline,
      timelines: state.timelines.map((t) => (t._id === timelineId ? data.timeline : t)),
    }));

    const socket = getSocket();
    socket?.emit('timeline-update', { timelineId, timeline: data.timeline });
  },

  joinTimelineRoom: (timelineId) => {
    const socket = getSocket();
    socket?.emit('join-timeline', timelineId);
  },

  leaveTimelineRoom: (timelineId) => {
    const socket = getSocket();
    socket?.emit('leave-timeline', timelineId);
  },

  // Day management
  addDay: async (timelineId, dayData) => {
    const { data } = await api.post(`/timelines/${timelineId}/days`, dayData);
    set((state) => ({
      currentTimeline: state.currentTimeline
        ? { ...state.currentTimeline, days: data.days }
        : null,
    }));

    const socket = getSocket();
    socket?.emit('timeline-update', { timelineId, days: data.days });
  },

  updateDay: async (timelineId, dayId, dayData) => {
    const { data } = await api.put(`/timelines/${timelineId}/days/${dayId}`, dayData);
    set((state) => ({
      currentTimeline: state.currentTimeline
        ? { ...state.currentTimeline, days: data.days }
        : null,
    }));

    const socket = getSocket();
    socket?.emit('timeline-update', { timelineId, days: data.days });
  },

  deleteDay: async (timelineId, dayId) => {
    const { data } = await api.delete(`/timelines/${timelineId}/days/${dayId}`);
    set((state) => ({
      currentTimeline: state.currentTimeline
        ? { ...state.currentTimeline, days: data.days }
        : null,
    }));

    const socket = getSocket();
    socket?.emit('timeline-update', { timelineId, days: data.days });
  },

  // Day event management
  addDayEvent: async (timelineId, dayId, eventData) => {
    const { data } = await api.post(`/timelines/${timelineId}/days/${dayId}/events`, eventData);
    set((state) => {
      if (!state.currentTimeline) return { currentTimeline: null };
      return {
        currentTimeline: {
          ...state.currentTimeline,
          days: state.currentTimeline.days.map((d) =>
            d._id === dayId ? data.day : d
          ),
        },
      };
    });

    const socket = getSocket();
    socket?.emit('event-added', { timelineId, dayId, event: data.event });
  },

  updateDayEvent: async (timelineId, dayId, eventId, eventData) => {
    const { data } = await api.put(`/timelines/${timelineId}/days/${dayId}/events/${eventId}`, eventData);
    set((state) => {
      if (!state.currentTimeline) return { currentTimeline: null };
      return {
        currentTimeline: {
          ...state.currentTimeline,
          days: state.currentTimeline.days.map((d) =>
            d._id === dayId ? data.day : d
          ),
        },
      };
    });

    const socket = getSocket();
    socket?.emit('event-updated', { timelineId, dayId, event: data.event });
  },

  deleteDayEvent: async (timelineId, dayId, eventId) => {
    const { data } = await api.delete(`/timelines/${timelineId}/days/${dayId}/events/${eventId}`);
    set((state) => {
      if (!state.currentTimeline) return { currentTimeline: null };
      return {
        currentTimeline: {
          ...state.currentTimeline,
          days: state.currentTimeline.days.map((d) =>
            d._id === dayId ? data.day : d
          ),
        },
      };
    });

    const socket = getSocket();
    socket?.emit('event-deleted', { timelineId, dayId, eventId });
  },

  toggleDayEventCompletion: async (timelineId, dayId, eventId) => {
    const { data } = await api.patch(`/timelines/${timelineId}/days/${dayId}/events/${eventId}/complete`);
    set((state) => {
      if (!state.currentTimeline) return { currentTimeline: null };
      return {
        currentTimeline: {
          ...state.currentTimeline,
          days: state.currentTimeline.days.map((d) =>
            d._id === dayId ? data.day : d
          ),
        },
      };
    });

    const socket = getSocket();
    socket?.emit('event-updated', { timelineId, dayId, event: data.event });
  },

  addDayEventNote: async (timelineId, dayId, eventId, content) => {
    const { data } = await api.post(`/timelines/${timelineId}/days/${dayId}/events/${eventId}/notes`, { content });
    set((state) => {
      if (!state.currentTimeline) return { currentTimeline: null };
      return {
        currentTimeline: {
          ...state.currentTimeline,
          days: state.currentTimeline.days.map((d) =>
            d._id === dayId
              ? {
                  ...d,
                  events: d.events.map((e) =>
                    e._id === eventId ? { ...e, notes: [...e.notes, data.note] } : e
                  ),
                }
              : d
          ),
        },
      };
    });

    const socket = getSocket();
    socket?.emit('note-added', { timelineId, dayId, eventId, note: data.note });
  },
}));
