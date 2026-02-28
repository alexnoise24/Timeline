import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTimelineStore } from '@/store/timelineStore';
import {
  saveTimelinesOffline,
  getTimelinesOffline,
  getPendingChanges,
  clearPendingChange,
  updateLastSync,
  getLastSync,
  hasOfflineData,
  formatLastSync,
} from '@/lib/offlineStore';
import api from '@/lib/api';
import { toast } from 'sonner';

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string;
  pendingChangesCount: number;
  syncNow: () => Promise<void>;
  saveForOffline: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Never');
  const [pendingChangesCount, setPendingChangesCount] = useState(0);
  const { user } = useAuthStore();
  const { timelines, fetchTimelines } = useTimelineStore();

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online');
      // Auto-sync when coming back online
      syncPendingChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Changes will sync when connected.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load last sync time on mount
  useEffect(() => {
    if (user?._id) {
      loadLastSyncTime();
      loadPendingChangesCount();
    }
  }, [user?._id]);

  const loadLastSyncTime = async () => {
    if (!user?._id) return;
    const timestamp = await getLastSync(user._id);
    setLastSyncTime(formatLastSync(timestamp));
  };

  const loadPendingChangesCount = async () => {
    const changes = await getPendingChanges();
    setPendingChangesCount(changes.length);
  };

  // Save current timelines for offline use
  const saveForOffline = useCallback(async () => {
    if (!user?._id || !timelines.length) return;

    try {
      await saveTimelinesOffline(timelines, user._id);
      await updateLastSync(user._id);
      await loadLastSyncTime();
      toast.success('Saved for offline use');
    } catch (error) {
      console.error('Error saving for offline:', error);
      toast.error('Failed to save offline data');
    }
  }, [user?._id, timelines]);

  // Sync pending changes when back online
  const syncPendingChanges = async () => {
    if (!isOnline || isSyncing) return;

    const changes = await getPendingChanges();
    if (changes.length === 0) return;

    setIsSyncing(true);
    let syncedCount = 0;

    try {
      for (const change of changes) {
        try {
          switch (change.method) {
            case 'POST':
              await api.post(change.endpoint, change.data);
              break;
            case 'PUT':
              await api.put(change.endpoint, change.data);
              break;
            case 'PATCH':
              await api.patch(change.endpoint, change.data);
              break;
            case 'DELETE':
              await api.delete(change.endpoint);
              break;
          }
          
          if (change.id) {
            await clearPendingChange(change.id);
          }
          syncedCount++;
        } catch (error) {
          console.error('Error syncing change:', error);
          // Keep the change in queue if it fails
        }
      }

      if (syncedCount > 0) {
        toast.success(`Synced ${syncedCount} pending changes`);
        await loadPendingChangesCount();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Manual sync
  const syncNow = useCallback(async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    setIsSyncing(true);

    try {
      // First sync pending changes
      await syncPendingChanges();

      // Fetch fresh data from server
      await fetchTimelines();
      
      // Save to offline storage
      if (user?._id) {
        const response = await api.get('/timelines');
        const freshTimelines = response.data.timelines || response.data;
        await saveTimelinesOffline(freshTimelines, user._id);
        await updateLastSync(user._id);
        await loadLastSyncTime();
      }

      toast.success('Synced successfully');
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, user?._id, fetchTimelines]);

  // Load offline data if offline on mount
  useEffect(() => {
    const loadOfflineData = async () => {
      if (!isOnline && user?._id) {
        const hasData = await hasOfflineData(user._id);
        if (hasData) {
          const cachedTimelines = await getTimelinesOffline(user._id);
          console.log('Loaded', cachedTimelines.length, 'timelines from offline cache');
          toast.info('Working offline with cached data');
        }
      }
    };

    loadOfflineData();
  }, [isOnline, user?._id]);

  // Auto-save timelines when they change (debounced)
  useEffect(() => {
    if (!user?._id || !timelines.length || !isOnline) return;

    const timeout = setTimeout(() => {
      saveTimelinesOffline(timelines, user._id).catch(console.error);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [timelines, user?._id, isOnline]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isSyncing,
        lastSyncTime,
        pendingChangesCount,
        syncNow,
        saveForOffline,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
