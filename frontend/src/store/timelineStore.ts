import { create } from 'zustand';
import { Timeline, Event, Shot, InspirationImage } from '@/types';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { watchService } from '@/services/watchService';
import {
  saveTimelineOffline,
  saveTimelinesOffline,
  getTimelineOffline,
  getTimelinesOffline,
  deleteTimelineOffline,
  addPendingChange,
  updateLastSync,
} from '@/lib/offlineStore';

const getUserId = (): string => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user._id || user.id || '';
  } catch {
    return '';
  }
};

interface TimelineState {
  timelines: Timeline[];
  currentTimeline: Timeline | null;
  isLoading: boolean;
  accessDenied: boolean;
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
  reorderDayEvents: (timelineId: string, dayId: string, orderedEventIds: string[]) => Promise<void>;
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
  accessDenied: false,

  fetchTimelines: async () => {
    set({ isLoading: true });
    const userId = getUserId();
    
    if (navigator.onLine) {
      try {
        const { data } = await api.get('/timelines');
        set({ timelines: data.timelines });
        watchService.syncTimelines(data.timelines);
        if (userId) {
          await saveTimelinesOffline(data.timelines, userId);
          await updateLastSync(userId);
        }
      } catch (error) {
        console.error('Error fetching timelines:', error);
        if (userId) {
          const cached = await getTimelinesOffline(userId);
          set({ timelines: cached });
          watchService.syncTimelines(cached);
        }
      }
    } else {
      if (userId) {
        const cached = await getTimelinesOffline(userId);
        set({ timelines: cached });
        watchService.syncTimelines(cached);
      }
    }
    set({ isLoading: false });
  },

  fetchTimeline: async (id) => {
    set({ isLoading: true, accessDenied: false });
    const userId = getUserId();

    if (navigator.onLine) {
      try {
        const { data } = await api.get(`/timelines/${id}`);
        set({ currentTimeline: data.timeline });
        get().joinTimelineRoom(id);
        if (userId) {
          await saveTimelineOffline(data.timeline, userId);
          await updateLastSync(userId);
        }
      } catch (error: any) {
        if (error?.response?.status === 403) {
          set({ accessDenied: true, currentTimeline: null });
        } else {
          console.error('Error fetching timeline:', error);
          const cached = await getTimelineOffline(id);
          if (cached) set({ currentTimeline: cached });
        }
      }
    } else {
      const cached = await getTimelineOffline(id);
      if (cached) set({ currentTimeline: cached });
    }
    set({ isLoading: false });
  },

  createTimeline: async (timelineData) => {
    const userId = getUserId();
    
    if (navigator.onLine) {
      try {
        const { data } = await api.post('/timelines', timelineData);
        set((state) => ({ timelines: [data.timeline, ...state.timelines] }));
        if (userId) {
          await saveTimelineOffline(data.timeline, userId);
          await updateLastSync(userId);
        }
        return data.timeline;
      } catch (error) {
        console.error('Error creating timeline:', error);
        await addPendingChange({
          type: 'create',
          endpoint: '/timelines',
          method: 'POST',
          data: timelineData,
        });
        const offlineId = `offline-${Date.now()}`;
        const offlineTimeline = { 
          ...timelineData, 
          _id: offlineId,
          events: [],
          shotList: [],
          days: [],
          collaborators: [],
          inspiration: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Timeline;
        set((state) => ({ timelines: [offlineTimeline, ...state.timelines] }));
        if (userId) await saveTimelineOffline(offlineTimeline, userId);
        return offlineTimeline;
      }
    } else {
      await addPendingChange({
        type: 'create',
        endpoint: '/timelines',
        method: 'POST',
        data: timelineData,
      });
      const offlineId = `offline-${Date.now()}`;
      const offlineTimeline = { 
        ...timelineData, 
        _id: offlineId,
        events: [],
        shotList: [],
        days: [],
        collaborators: [],
        inspiration: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Timeline;
      set((state) => ({ timelines: [offlineTimeline, ...state.timelines] }));
      if (userId) await saveTimelineOffline(offlineTimeline, userId);
      return offlineTimeline;
    }
  },

  updateTimeline: async (id, timelineData) => {
    const userId = getUserId();
    const optimisticTimeline = { ...get().currentTimeline, ...timelineData, _id: id } as Timeline;
    
    if (navigator.onLine) {
      try {
        const { data } = await api.put(`/timelines/${id}`, timelineData);
        const updatedTimelines = get().timelines.map((t) => (t._id === id ? data.timeline : t));
        set((state) => ({
          timelines: updatedTimelines,
          currentTimeline: state.currentTimeline?._id === id ? data.timeline : state.currentTimeline,
        }));
        watchService.syncTimelines(updatedTimelines);
        if (userId) await saveTimelineOffline(data.timeline, userId);
        const socket = getSocket();
        socket?.emit('timeline-update', { timelineId: id, timeline: data.timeline });
      } catch (error) {
        console.error('Error updating timeline:', error);
        await addPendingChange({
          type: 'update',
          endpoint: `/timelines/${id}`,
          method: 'PUT',
          data: timelineData,
        });
        const updatedTimelines = get().timelines.map((t) => (t._id === id ? optimisticTimeline : t));
        set((state) => ({
          timelines: updatedTimelines,
          currentTimeline: state.currentTimeline?._id === id ? optimisticTimeline : state.currentTimeline,
        }));
        if (userId) await saveTimelineOffline(optimisticTimeline, userId);
      }
    } else {
      await addPendingChange({
        type: 'update',
        endpoint: `/timelines/${id}`,
        method: 'PUT',
        data: timelineData,
      });
      const updatedTimelines = get().timelines.map((t) => (t._id === id ? optimisticTimeline : t));
      set((state) => ({
        timelines: updatedTimelines,
        currentTimeline: state.currentTimeline?._id === id ? optimisticTimeline : state.currentTimeline,
      }));
      if (userId) await saveTimelineOffline(optimisticTimeline, userId);
    }
  },

  deleteTimeline: async (id) => {
    const optimisticUpdate = () => {
      set((state) => ({
        timelines: state.timelines.filter((t) => t._id !== id),
        currentTimeline: state.currentTimeline?._id === id ? null : state.currentTimeline,
      }));
    };
    
    if (navigator.onLine) {
      try {
        await api.delete(`/timelines/${id}`);
        optimisticUpdate();
        await deleteTimelineOffline(id);
        const socket = getSocket();
        socket?.emit('timeline-deleted', { timelineId: id });
      } catch (error) {
        console.error('Error deleting timeline:', error);
        await addPendingChange({
          type: 'delete',
          endpoint: `/timelines/${id}`,
          method: 'DELETE',
          data: { id },
        });
        optimisticUpdate();
        await deleteTimelineOffline(id);
      }
    } else {
      await addPendingChange({
        type: 'delete',
        endpoint: `/timelines/${id}`,
        method: 'DELETE',
        data: { id },
      });
      optimisticUpdate();
      await deleteTimelineOffline(id);
    }
  },

  addEvent: async (timelineId, eventData) => {
    const userId = getUserId();
    const tempEvent = { ...eventData, _id: `temp-${Date.now()}` } as Event;
    
    const optimisticUpdate = () => {
      set((state) => ({
        currentTimeline: state.currentTimeline
          ? { ...state.currentTimeline, events: [...state.currentTimeline.events, tempEvent] }
          : null,
      }));
    };
    
    if (navigator.onLine) {
      try {
        const { data } = await api.post(`/timelines/${timelineId}/events`, eventData);
        set((state) => ({
          currentTimeline: state.currentTimeline
            ? { ...state.currentTimeline, events: [...state.currentTimeline.events, data.event] }
            : null,
        }));
        if (userId && get().currentTimeline) {
          await saveTimelineOffline(get().currentTimeline!, userId);
        }
        const socket = getSocket();
        socket?.emit('event-added', { timelineId, event: data.event });
      } catch (error) {
        console.error('Error adding event:', error);
        await addPendingChange({
          type: 'create',
          endpoint: `/timelines/${timelineId}/events`,
          method: 'POST',
          data: eventData,
        });
        optimisticUpdate();
      }
    } else {
      await addPendingChange({
        type: 'create',
        endpoint: `/timelines/${timelineId}/events`,
        method: 'POST',
        data: eventData,
      });
      optimisticUpdate();
    }
  },

  updateEvent: async (timelineId, eventId, eventData) => {
    const userId = getUserId();
    
    const optimisticUpdate = () => {
      set((state) => ({
        currentTimeline: state.currentTimeline
          ? {
              ...state.currentTimeline,
              events: state.currentTimeline.events.map((e) =>
                e._id === eventId ? { ...e, ...eventData } : e
              ),
            }
          : null,
      }));
    };
    
    if (navigator.onLine) {
      try {
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
        if (userId && get().currentTimeline) {
          await saveTimelineOffline(get().currentTimeline!, userId);
        }
        const socket = getSocket();
        socket?.emit('event-updated', { timelineId, event: data.event });
      } catch (error) {
        console.error('Error updating event:', error);
        await addPendingChange({
          type: 'update',
          endpoint: `/timelines/${timelineId}/events/${eventId}`,
          method: 'PUT',
          data: eventData,
        });
        optimisticUpdate();
      }
    } else {
      await addPendingChange({
        type: 'update',
        endpoint: `/timelines/${timelineId}/events/${eventId}`,
        method: 'PUT',
        data: eventData,
      });
      optimisticUpdate();
    }
  },

  deleteEvent: async (timelineId, eventId) => {
    const userId = getUserId();
    
    const optimisticUpdate = () => {
      set((state) => ({
        currentTimeline: state.currentTimeline
          ? {
              ...state.currentTimeline,
              events: state.currentTimeline.events.filter((e) => e._id !== eventId),
            }
          : null,
      }));
    };
    
    if (navigator.onLine) {
      try {
        await api.delete(`/timelines/${timelineId}/events/${eventId}`);
        optimisticUpdate();
        if (userId && get().currentTimeline) {
          await saveTimelineOffline(get().currentTimeline!, userId);
        }
        const socket = getSocket();
        socket?.emit('event-deleted', { timelineId, eventId });
      } catch (error) {
        console.error('Error deleting event:', error);
        await addPendingChange({
          type: 'delete',
          endpoint: `/timelines/${timelineId}/events/${eventId}`,
          method: 'DELETE',
          data: { eventId },
        });
        optimisticUpdate();
      }
    } else {
      await addPendingChange({
        type: 'delete',
        endpoint: `/timelines/${timelineId}/events/${eventId}`,
        method: 'DELETE',
        data: { eventId },
      });
      optimisticUpdate();
    }
  },

  toggleEventCompletion: async (timelineId, eventId) => {
    const userId = getUserId();
    const currentEvent = get().currentTimeline?.events.find((e) => e._id === eventId);
    
    const optimisticUpdate = () => {
      set((state) => ({
        currentTimeline: state.currentTimeline
          ? {
              ...state.currentTimeline,
              events: state.currentTimeline.events.map((e) =>
                e._id === eventId ? { ...e, isCompleted: !e.isCompleted } : e
              ),
            }
          : null,
      }));
    };
    
    if (navigator.onLine) {
      try {
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
        if (userId && get().currentTimeline) {
          await saveTimelineOffline(get().currentTimeline!, userId);
        }
        const socket = getSocket();
        socket?.emit('event-updated', { timelineId, event: data.event });
      } catch (error) {
        console.error('Error toggling event:', error);
        await addPendingChange({
          type: 'update',
          endpoint: `/timelines/${timelineId}/events/${eventId}/complete`,
          method: 'PATCH',
          data: { isCompleted: !currentEvent?.isCompleted },
        });
        optimisticUpdate();
      }
    } else {
      await addPendingChange({
        type: 'update',
        endpoint: `/timelines/${timelineId}/events/${eventId}/complete`,
        method: 'PATCH',
        data: { isCompleted: !currentEvent?.isCompleted },
      });
      optimisticUpdate();
    }
  },

  addNote: async (timelineId, eventId, content) => {
    const userId = getUserId();
    const tempNote = { _id: `temp-${Date.now()}`, content, createdAt: new Date().toISOString(), author: { _id: userId, name: '', email: '', role: 'photographer' as const, createdAt: new Date().toISOString() } };
    
    const optimisticUpdate = () => {
      set((state) => ({
        currentTimeline: state.currentTimeline
          ? {
              ...state.currentTimeline,
              events: state.currentTimeline.events.map((e) =>
                e._id === eventId ? { ...e, notes: [...e.notes, tempNote] } : e
              ),
            }
          : null,
      }));
    };
    
    if (navigator.onLine) {
      try {
        const { data } = await api.post(`/timelines/${timelineId}/events/${eventId}/notes`, { content });
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
        if (userId && get().currentTimeline) {
          await saveTimelineOffline(get().currentTimeline!, userId);
        }
        const socket = getSocket();
        socket?.emit('note-added', { timelineId, eventId, note: data.note });
      } catch (error) {
        console.error('Error adding note:', error);
        await addPendingChange({
          type: 'create',
          endpoint: `/timelines/${timelineId}/events/${eventId}/notes`,
          method: 'POST',
          data: { content },
        });
        optimisticUpdate();
      }
    } else {
      await addPendingChange({
        type: 'create',
        endpoint: `/timelines/${timelineId}/events/${eventId}/notes`,
        method: 'POST',
        data: { content },
      });
      optimisticUpdate();
    }
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
    const userId = getUserId();
    const tempShot = { ...shotData, _id: `temp-${Date.now()}` } as Shot;
    
    const optimisticUpdate = () => {
      set((state) => ({
        currentTimeline: state.currentTimeline
          ? { ...state.currentTimeline, shotList: [...state.currentTimeline.shotList, tempShot] }
          : null,
      }));
    };
    
    if (navigator.onLine) {
      try {
        const { data } = await api.post(`/timelines/${timelineId}/shots`, shotData);
        set((state) => ({
          currentTimeline: state.currentTimeline
            ? { ...state.currentTimeline, shotList: [...state.currentTimeline.shotList, data.shot] }
            : null,
        }));
        if (userId && get().currentTimeline) {
          await saveTimelineOffline(get().currentTimeline!, userId);
        }
        const socket = getSocket();
        socket?.emit('shot-added', { timelineId, shot: data.shot });
      } catch (error) {
        console.error('Error adding shot:', error);
        await addPendingChange({
          type: 'create',
          endpoint: `/timelines/${timelineId}/shots`,
          method: 'POST',
          data: shotData,
        });
        optimisticUpdate();
      }
    } else {
      await addPendingChange({
        type: 'create',
        endpoint: `/timelines/${timelineId}/shots`,
        method: 'POST',
        data: shotData,
      });
      optimisticUpdate();
    }
  },

  updateShot: async (timelineId, shotId, shotData) => {
    const userId = getUserId();
    
    const optimisticUpdate = () => {
      set((state) => ({
        currentTimeline: state.currentTimeline
          ? {
              ...state.currentTimeline,
              shotList: state.currentTimeline.shotList.map((s) =>
                s._id === shotId ? { ...s, ...shotData } : s
              ),
            }
          : null,
      }));
    };
    
    if (navigator.onLine) {
      try {
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
        if (userId && get().currentTimeline) {
          await saveTimelineOffline(get().currentTimeline!, userId);
        }
        const socket = getSocket();
        socket?.emit('shot-updated', { timelineId, shot: data.shot });
      } catch (error) {
        console.error('Error updating shot:', error);
        await addPendingChange({
          type: 'update',
          endpoint: `/timelines/${timelineId}/shots/${shotId}`,
          method: 'PUT',
          data: shotData,
        });
        optimisticUpdate();
      }
    } else {
      await addPendingChange({
        type: 'update',
        endpoint: `/timelines/${timelineId}/shots/${shotId}`,
        method: 'PUT',
        data: shotData,
      });
      optimisticUpdate();
    }
  },

  deleteShot: async (timelineId, shotId) => {
    const userId = getUserId();
    
    const optimisticUpdate = () => {
      set((state) => ({
        currentTimeline: state.currentTimeline
          ? {
              ...state.currentTimeline,
              shotList: state.currentTimeline.shotList.filter((s) => s._id !== shotId),
            }
          : null,
      }));
    };
    
    if (navigator.onLine) {
      try {
        await api.delete(`/timelines/${timelineId}/shots/${shotId}`);
        optimisticUpdate();
        if (userId && get().currentTimeline) {
          await saveTimelineOffline(get().currentTimeline!, userId);
        }
        const socket = getSocket();
        socket?.emit('shot-deleted', { timelineId, shotId });
      } catch (error) {
        console.error('Error deleting shot:', error);
        await addPendingChange({
          type: 'delete',
          endpoint: `/timelines/${timelineId}/shots/${shotId}`,
          method: 'DELETE',
          data: { shotId },
        });
        optimisticUpdate();
      }
    } else {
      await addPendingChange({
        type: 'delete',
        endpoint: `/timelines/${timelineId}/shots/${shotId}`,
        method: 'DELETE',
        data: { shotId },
      });
      optimisticUpdate();
    }
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
    const userId = getUserId();
    
    if (navigator.onLine) {
      try {
        const { data } = await api.post(`/timelines/${timelineId}/days`, dayData);
        set((state) => ({
          currentTimeline: state.currentTimeline
            ? { ...state.currentTimeline, days: data.days }
            : null,
        }));
        if (userId && get().currentTimeline) {
          await saveTimelineOffline(get().currentTimeline!, userId);
        }
        const socket = getSocket();
        socket?.emit('timeline-update', { timelineId, days: data.days });
      } catch (error) {
        console.error('Error adding day:', error);
        await addPendingChange({
          type: 'create',
          endpoint: `/timelines/${timelineId}/days`,
          method: 'POST',
          data: dayData,
        });
      }
    } else {
      await addPendingChange({
        type: 'create',
        endpoint: `/timelines/${timelineId}/days`,
        method: 'POST',
        data: dayData,
      });
    }
  },

  updateDay: async (timelineId, dayId, dayData) => {
    const userId = getUserId();
    
    if (navigator.onLine) {
      try {
        const { data } = await api.put(`/timelines/${timelineId}/days/${dayId}`, dayData);
        set((state) => ({
          currentTimeline: state.currentTimeline
            ? { ...state.currentTimeline, days: data.days }
            : null,
        }));
        if (userId && get().currentTimeline) {
          await saveTimelineOffline(get().currentTimeline!, userId);
        }
        const socket = getSocket();
        socket?.emit('timeline-update', { timelineId, days: data.days });
      } catch (error) {
        console.error('Error updating day:', error);
        await addPendingChange({
          type: 'update',
          endpoint: `/timelines/${timelineId}/days/${dayId}`,
          method: 'PUT',
          data: dayData,
        });
      }
    } else {
      await addPendingChange({
        type: 'update',
        endpoint: `/timelines/${timelineId}/days/${dayId}`,
        method: 'PUT',
        data: dayData,
      });
    }
  },

  deleteDay: async (timelineId, dayId) => {
    const userId = getUserId();
    
    if (navigator.onLine) {
      try {
        const { data } = await api.delete(`/timelines/${timelineId}/days/${dayId}`);
        set((state) => ({
          currentTimeline: state.currentTimeline
            ? { ...state.currentTimeline, days: data.days }
            : null,
        }));
        if (userId && get().currentTimeline) {
          await saveTimelineOffline(get().currentTimeline!, userId);
        }
        const socket = getSocket();
        socket?.emit('timeline-update', { timelineId, days: data.days });
      } catch (error) {
        console.error('Error deleting day:', error);
        await addPendingChange({
          type: 'delete',
          endpoint: `/timelines/${timelineId}/days/${dayId}`,
          method: 'DELETE',
          data: { dayId },
        });
      }
    } else {
      await addPendingChange({
        type: 'delete',
        endpoint: `/timelines/${timelineId}/days/${dayId}`,
        method: 'DELETE',
        data: { dayId },
      });
    }
  },

  // Day event management
  addDayEvent: async (timelineId, dayId, eventData) => {
    const userId = getUserId();
    
    if (navigator.onLine) {
      try {
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
        if (userId && get().currentTimeline) {
          await saveTimelineOffline(get().currentTimeline!, userId);
        }
        const socket = getSocket();
        socket?.emit('event-added', { timelineId, dayId, event: data.event });
      } catch (error) {
        console.error('Error adding day event:', error);
        await addPendingChange({
          type: 'create',
          endpoint: `/timelines/${timelineId}/days/${dayId}/events`,
          method: 'POST',
          data: eventData,
        });
      }
    } else {
      await addPendingChange({
        type: 'create',
        endpoint: `/timelines/${timelineId}/days/${dayId}/events`,
        method: 'POST',
        data: eventData,
      });
    }
  },

  updateDayEvent: async (timelineId, dayId, eventId, eventData) => {
    const userId = getUserId();
    
    if (navigator.onLine) {
      try {
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
        if (userId && get().currentTimeline) {
          await saveTimelineOffline(get().currentTimeline!, userId);
        }
        const socket = getSocket();
        socket?.emit('event-updated', { timelineId, dayId, event: data.event });
      } catch (error) {
        console.error('Error updating day event:', error);
        await addPendingChange({
          type: 'update',
          endpoint: `/timelines/${timelineId}/days/${dayId}/events/${eventId}`,
          method: 'PUT',
          data: eventData,
        });
      }
    } else {
      await addPendingChange({
        type: 'update',
        endpoint: `/timelines/${timelineId}/days/${dayId}/events/${eventId}`,
        method: 'PUT',
        data: eventData,
      });
    }
  },

  deleteDayEvent: async (timelineId, dayId, eventId) => {
    const userId = getUserId();
    
    if (navigator.onLine) {
      try {
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
        if (userId && get().currentTimeline) {
          await saveTimelineOffline(get().currentTimeline!, userId);
        }
        const socket = getSocket();
        socket?.emit('event-deleted', { timelineId, dayId, eventId });
      } catch (error) {
        console.error('Error deleting day event:', error);
        await addPendingChange({
          type: 'delete',
          endpoint: `/timelines/${timelineId}/days/${dayId}/events/${eventId}`,
          method: 'DELETE',
          data: { eventId },
        });
      }
    } else {
      await addPendingChange({
        type: 'delete',
        endpoint: `/timelines/${timelineId}/days/${dayId}/events/${eventId}`,
        method: 'DELETE',
        data: { eventId },
      });
    }
  },

  toggleDayEventCompletion: async (timelineId, dayId, eventId) => {
    const userId = getUserId();
    
    const optimisticUpdate = () => {
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
                      e._id === eventId ? { ...e, isCompleted: !e.isCompleted } : e
                    ),
                  }
                : d
            ),
          },
        };
      });
    };
    
    if (navigator.onLine) {
      try {
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
        if (userId && get().currentTimeline) {
          await saveTimelineOffline(get().currentTimeline!, userId);
        }
        const socket = getSocket();
        socket?.emit('event-updated', { timelineId, dayId, event: data.event });
      } catch (error) {
        console.error('Error toggling day event:', error);
        await addPendingChange({
          type: 'update',
          endpoint: `/timelines/${timelineId}/days/${dayId}/events/${eventId}/complete`,
          method: 'PATCH',
          data: {},
        });
        optimisticUpdate();
      }
    } else {
      await addPendingChange({
        type: 'update',
        endpoint: `/timelines/${timelineId}/days/${dayId}/events/${eventId}/complete`,
        method: 'PATCH',
        data: {},
      });
      optimisticUpdate();
    }
  },

  reorderDayEvents: async (timelineId, dayId, orderedEventIds) => {
    const userId = getUserId();

    // Optimistic: apply the new sortIndex locally right away so the drag feels instant
    const positions = new Map(orderedEventIds.map((eventId, index) => [eventId, index]));
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
                    positions.has(e._id) ? { ...e, sortIndex: positions.get(e._id) } : e
                  ),
                }
              : d
          ),
        },
      };
    });

    try {
      const { data } = await api.put(`/timelines/${timelineId}/days/${dayId}/reorder`, { orderedEventIds });
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
      if (userId && get().currentTimeline) {
        await saveTimelineOffline(get().currentTimeline!, userId);
      }
    } catch (error) {
      console.error('Error reordering day events:', error);
      throw error;
    }
  },

  addDayEventNote: async (timelineId, dayId, eventId, content) => {
    const userId = getUserId();
    
    if (navigator.onLine) {
      try {
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
        if (userId && get().currentTimeline) {
          await saveTimelineOffline(get().currentTimeline!, userId);
        }
        const socket = getSocket();
        socket?.emit('note-added', { timelineId, dayId, eventId, note: data.note });
      } catch (error) {
        console.error('Error adding day event note:', error);
        await addPendingChange({
          type: 'create',
          endpoint: `/timelines/${timelineId}/days/${dayId}/events/${eventId}/notes`,
          method: 'POST',
          data: { content },
        });
      }
    } else {
      await addPendingChange({
        type: 'create',
        endpoint: `/timelines/${timelineId}/days/${dayId}/events/${eventId}/notes`,
        method: 'POST',
        data: { content },
      });
    }
  },
}));
