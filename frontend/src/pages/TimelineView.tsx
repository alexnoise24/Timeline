import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Calendar, MapPin, MessageSquare, History, Users, ArrowLeft, Clipboard, Camera, Edit2, Trash2, CheckCircle2, Circle, ChevronRight, Sparkles, FileDown, MoreHorizontal, GripVertical, ArrowDownUp } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { exportTimelinePDF } from '@/components/TimelinePDFExport';
import { useTimelineStore } from '@/store/timelineStore';
import { useAuthStore } from '@/store/authStore';
import { useInvitationsStore } from '@/store/invitationsStore';
import { usePlatform } from '@/hooks/usePlatform';
import { Event, Day } from '@/types';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
// Card import removed — no longer used in Alto redesign
import CountdownTimer from '@/components/CountdownTimer';
import { formatDate, formatDateTime, getActiveDay, getCategoryLabel, getInitials, hasFullAccess } from '@/lib/utils';
import Overview from '@/components/Overview';
import ShootList from '@/components/ShootList';
import Inspiration from '@/components/Inspiration';
import Sidebar from '@/components/Sidebar';
import CollaboratorsModal from '@/components/CollaboratorsModal';
import WeddingSwipeView from '@/components/WeddingSwipeView';
import { watchService } from '@/services/watchService';
import { logWeddingMode } from '@/lib/api';

type TabType = 'overview' | 'timeline' | 'shotlist' | 'inspiration';

export default function TimelineView() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentTimeline,
    fetchTimeline,
    addDay,
    updateDay,
    deleteDay,
    addDayEvent,
    updateDayEvent,
    deleteDayEvent,
    toggleDayEventCompletion,
    addDayEventNote,
    reorderDayEvents,
    isLoading,
    accessDenied,
    timelines
  } = useTimelineStore();
  const { user } = useAuthStore();
  useInvitationsStore();
  // Wedding-mode / Watch are gated by the CURRENT user's plan
  const hasPro = hasFullAccess(user);
  // Inspiration is gated by the timeline OWNER's plan (so a free guest on a
  // Pro owner's project still sees it; a free owner hides it for everyone).
  const ownerHasPro = hasFullAccess(currentTimeline?.owner as any);
  const isNative = Capacitor.isNativePlatform();
  usePlatform(); // keep hook call for side-effects, isIOS no longer used in Alto layout
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    time: '',
    location: '',
    category: 'other' as Event['category'],
  });
  const [openEventMenuId, setOpenEventMenuId] = useState<string | null>(null);
  // Day modal state
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isEditingDay, setIsEditingDay] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const [dayFormData, setDayFormData] = useState({
    date: '',
    label: '',
  });
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isCollaboratorsModalOpen, setIsCollaboratorsModalOpen] = useState(false);
  
  // Field mode (wedding day) state - persisted in localStorage
  const [fieldModeActive, setFieldModeActive] = useState(() => {
    if (typeof window !== 'undefined' && id) {
      return localStorage.getItem(`lenzu-wedding-mode-${id}`) === 'true';
    }
    return false;
  });
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Handle resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close event context menu on outside click
  useEffect(() => {
    if (!openEventMenuId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-event-menu]')) setOpenEventMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openEventMenuId]);

  // Toggle field-mode class on document root and persist to localStorage
  useEffect(() => {
    if (fieldModeActive) {
      document.documentElement.classList.add('field-mode');
      if (id) {
        localStorage.setItem(`lenzu-wedding-mode-${id}`, 'true');
        if (hasPro) {
          watchService.syncWeddingMode(id, true);

          // Sync all timelines to Watch
          if (timelines && timelines.length > 0) {
            watchService.syncTimelines(timelines);
          } else {
            watchService.syncTimelines([currentTimeline].filter(Boolean) as any);
          }

          // Schedule iOS local notifications only for the active day's events
          // (the native scheduler assumes "today" — other days' events would fire on the wrong date)
          if (currentTimeline?.days) {
            const activeDay = getActiveDay(currentTimeline.days);
            const events = (activeDay?.events || [])
              .filter(event => event.time)
              .map(event => ({
                id: event._id,
                time: event.time!,
                title: event.title,
              }));
            watchService.scheduleEventNotifications(events);
          }
        }
      }
    } else {
      document.documentElement.classList.remove('field-mode');
      if (id) {
        localStorage.removeItem(`lenzu-wedding-mode-${id}`);
        if (hasPro) {
          watchService.syncWeddingMode(id, false);
          watchService.cancelAllNotifications();
        }
      }
    }
    return () => document.documentElement.classList.remove('field-mode');
  }, [fieldModeActive, id, currentTimeline?.days]);

  // Active event detection state
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const activeEventRef = useRef<HTMLDivElement>(null);
  const hasScrolledToActive = useRef(false);

  useEffect(() => {
    if (id) {
      fetchTimeline(id);
    }
  }, [id, fetchTimeline]);

  // Detect active event based on current time
  const detectActiveEvent = useCallback(() => {
    if (!currentTimeline?.days) return null;
    
    const now = new Date();
    let lastPassedEvent: { eventId: string; dateTime: Date } | null = null;
    
    for (const day of currentTimeline.days) {
      const dayDate = new Date(day.date).toISOString().split('T')[0];
      
      for (const event of day.events) {
        if (!event.time) continue;
        
        const eventDateTime = new Date(`${dayDate}T${event.time}`);
        
        if (eventDateTime <= now) {
          if (!lastPassedEvent || eventDateTime > lastPassedEvent.dateTime) {
            lastPassedEvent = { eventId: event._id, dateTime: eventDateTime };
          }
        }
      }
    }
    
    // Check if there's a next event (to confirm we're "between" events)
    if (lastPassedEvent) {
      let hasNextEvent = false;
      for (const day of currentTimeline.days) {
        const dayDate = new Date(day.date).toISOString().split('T')[0];
        for (const event of day.events) {
          if (!event.time) continue;
          const eventDateTime = new Date(`${dayDate}T${event.time}`);
          if (eventDateTime > now) {
            hasNextEvent = true;
            break;
          }
        }
        if (hasNextEvent) break;
      }
      
      // Only show active if there's a next event (we're between events)
      if (hasNextEvent) {
        return lastPassedEvent.eventId;
      }
    }
    
    return null;
  }, [currentTimeline?.days]);

  // Update active event every 60 seconds
  useEffect(() => {
    const updateActiveEvent = () => {
      const newActiveId = detectActiveEvent();
      setActiveEventId(newActiveId);
    };
    
    updateActiveEvent();
    const interval = setInterval(updateActiveEvent, 60000);
    
    return () => clearInterval(interval);
  }, [detectActiveEvent]);

  // Scroll to active event once on mount
  useEffect(() => {
    if (activeEventId && activeEventRef.current && !hasScrolledToActive.current && activeTab === 'timeline') {
      hasScrolledToActive.current = true;
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        activeEventRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [activeEventId, activeTab]);

  // Collapse all days by default when timeline loads
  useEffect(() => {
    if (currentTimeline?.days && currentTimeline.days.length > 0) {
      const allDayIds = new Set(currentTimeline.days.map(d => d._id));
      setCollapsedDays(allDayIds);
    }
  }, [currentTimeline?._id]);

  // Day handlers
  const handleAddDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await addDay(id, dayFormData);
      setIsDayModalOpen(false);
      setIsEditingDay(false);
      setSelectedDay(null);
      setDayFormData({ date: '', label: '' });
    } catch (error) {
      console.error('Error saving day:', error);
    }
  };

  const handleUpdateDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedDay) return;

    try {
      await updateDay(id, selectedDay._id, dayFormData);
      setIsDayModalOpen(false);
      setIsEditingDay(false);
      setSelectedDay(null);
      setDayFormData({ date: '', label: '' });
    } catch (error) {
      console.error('Error updating day:', error);
    }
  };

  const handleDeleteDay = async (dayId: string, dayLabel: string) => {
    if (!id) return;
    const confirmMsg = dayLabel || formatDate(currentTimeline?.days.find(d => d._id === dayId)?.date || '', i18n.language);
    if (!window.confirm(t('timelineView.deleteDayConfirm', { label: confirmMsg }))) return;

    try {
      await deleteDay(id, dayId);
    } catch (error) {
      console.error('Error deleting day:', error);
    }
  };

  const openAddDayModal = () => {
    setIsEditingDay(false);
    setSelectedDay(null);
    // Default to day after the last day, or wedding date
    const lastDay = currentTimeline?.days?.[currentTimeline.days.length - 1];
    let defaultDate = '';
    if (lastDay) {
      const nextDay = new Date(lastDay.date);
      nextDay.setDate(nextDay.getDate() + 1);
      defaultDate = nextDay.toISOString().split('T')[0];
    } else if (currentTimeline?.weddingDate) {
      defaultDate = new Date(currentTimeline.weddingDate).toISOString().split('T')[0];
    }
    setDayFormData({ date: defaultDate, label: '' });
    setIsDayModalOpen(true);
  };

  const openEditDayModal = (day: Day) => {
    setIsEditingDay(true);
    setSelectedDay(day);
    setDayFormData({
      date: new Date(day.date).toISOString().split('T')[0],
      label: day.label || '',
    });
    setIsDayModalOpen(true);
  };

  const toggleDayCollapse = (dayId: string) => {
    setCollapsedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayId)) {
        newSet.delete(dayId);
      } else {
        newSet.add(dayId);
      }
      return newSet;
    });
  };

  // Event handlers (now work with days)
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedDayId) return;

    try {
      if (isEditingEvent && selectedEvent) {
        await updateDayEvent(id, selectedDayId, selectedEvent._id, eventFormData);
      } else {
        await addDayEvent(id, selectedDayId, eventFormData);
      }
      setIsEventModalOpen(false);
      setIsEditingEvent(false);
      setSelectedEvent(null);
      setSelectedDayId(null);
      setEventFormData({
        title: '',
        description: '',
        time: '',
        location: '',
        category: 'other',
      });
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const openEditEventModal = (event: Event, dayId: string) => {
    setSelectedEvent(event);
    setSelectedDayId(dayId);
    setIsEditingEvent(true);
    setEventFormData({
      title: event.title,
      description: event.description || '',
      time: event.time || '',
      location: event.location || '',
      category: event.category,
    });
    setIsEventModalOpen(true);
  };

  const openAddEventModal = (dayId: string) => {
    setIsEditingEvent(false);
    setSelectedEvent(null);
    setSelectedDayId(dayId);
    setEventFormData({
      title: '',
      description: '',
      time: '',
      location: '',
      category: 'other',
    });
    setIsEventModalOpen(true);
  };

  const handleDeleteEvent = async (dayId: string, eventId: string, eventTitle: string) => {
    if (!id) return;
    if (!window.confirm(t('timelineView.deleteEventConfirm', { title: eventTitle }))) return;

    try {
      await deleteDayEvent(id, dayId, eventId);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleToggleCompletion = async (dayId: string, eventId: string) => {
    if (!id) return;
    try {
      await toggleDayEventCompletion(id, dayId, eventId);
    } catch (error) {
      console.error('Error toggling event completion:', error);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedEvent || !selectedDayId || !noteContent.trim()) return;

    try {
      await addDayEventNote(id, selectedDayId, selectedEvent._id, noteContent);
      setNoteContent('');
      setIsNoteModalOpen(false);
      setSelectedEvent(null);
      setSelectedDayId(null);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleToggleFieldMode = (activate: boolean) => {
    if (activate) {
      const events = currentTimeline?.days
        ?.flatMap(day => day.events || [])
        .filter(event => event.time)
        .map(event => ({
          id: event._id,
          time: event.time!,
          title: event.title,
        })) || [];
      
      // Direct bridge call for testing
      try {
        (window as any).webkit?.messageHandlers?.watchBridge?.postMessage({
          action: 'scheduleNotifications',
          events: events.length > 0 ? events : [{id: 'test', time: '23:55', title: 'Test fallback'}]
        });
        console.log('Direct postMessage sent, events:', events.length);
      } catch(e) {
        console.log('postMessage error:', e);
      }
      
      setFieldModeActive(true);
      if (id) logWeddingMode(id, true);
    } else {
      watchService.cancelAllNotifications();
      setFieldModeActive(false);
      if (id) logWeddingMode(id, false);
    }
  };

  const openNoteModal = (event: Event, dayId: string) => {
    setSelectedEvent(event);
    setSelectedDayId(dayId);
    setIsNoteModalOpen(true);
  };

  // ── Manual event ordering (drag & drop) ──
  const [draggedEvent, setDraggedEvent] = useState<{ dayId: string; eventId: string } | null>(null);
  const [dragOverEventId, setDragOverEventId] = useState<string | null>(null);

  // Manual order (sortIndex) wins only when EVERY event of the day has one;
  // otherwise fall back to time order (legacy days keep behaving as before).
  const sortDayEvents = (events: Event[]) => {
    const manual = events.length > 0 && events.every((e) => typeof e.sortIndex === 'number');
    return [...events].sort((a, b) => {
      if (manual) return (a.sortIndex as number) - (b.sortIndex as number);
      return (a.time || '00:00').localeCompare(b.time || '00:00');
    });
  };

  const handleEventDrop = async (day: Day, targetEventId: string) => {
    if (!id || !draggedEvent || draggedEvent.dayId !== day._id) return;
    const orderedIds = sortDayEvents(day.events).map((e) => e._id);
    const fromIdx = orderedIds.indexOf(draggedEvent.eventId);
    const toIdx = orderedIds.indexOf(targetEventId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
    orderedIds.splice(toIdx, 0, ...orderedIds.splice(fromIdx, 1));
    try {
      await reorderDayEvents(id, day._id, orderedIds);
    } catch (error) {
      console.error('Error reordering events:', error);
    }
  };

  const handleSortChronologically = async (day: Day) => {
    if (!id || day.events.length < 2) return;
    // Events without a time go last
    const orderedIds = [...day.events]
      .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
      .map((e) => e._id);
    try {
      await reorderDayEvents(id, day._id, orderedIds);
    } catch (error) {
      console.error('Error sorting events chronologically:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full bg-paper">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <div className="flex items-center justify-center h-96">
            <p className="alto-label text-stone">{t('timelineView.loadingTimeline')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex h-full bg-paper">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <p className="font-mono text-[13px] text-ink">{t('timelineView.accessDenied')}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-[10px] bg-ink text-paper font-mono font-bold text-[11px] uppercase tracking-[0.08em] hover:bg-stone transition-colors duration-[80ms]"
            >
              {t('timelineView.goToMyProjects')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentTimeline) {
    return (
      <div className="flex h-full bg-paper">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <div className="flex items-center justify-center h-96">
            <p className="alto-label text-stone">{t('timelineView.timelineNotFound')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Sort days by date and events within each day by time
  const sortedDays = [...(currentTimeline.days || [])].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Mobile field mode - render WeddingSwipeView
  if (fieldModeActive && isMobile) {
    // Wedding mode shows only the active day so multi-day itineraries don't mix
    const activeDay = getActiveDay(sortedDays);
    const weddingDays = activeDay ? [activeDay] : sortedDays;
    return (
      <WeddingSwipeView
        timeline={currentTimeline}
        activeEventId={activeEventId}
        timelineContent={
          <div className="space-y-4">
            {weddingDays.map((day) => (
              <div key={day._id} className="bg-field-surface rounded-xl p-4">
                <h3 className="text-field-text font-medium mb-3">
                  {formatDate(day.date, i18n.language)}
                  {day.label && <span className="text-field-accent ml-2">— {day.label}</span>}
                </h3>
                <div className="space-y-3">
                  {[...day.events].sort((a, b) => {
                    const timeA = (a.time || '00:00').replace(':', '');
                    const timeB = (b.time || '00:00').replace(':', '');
                    return parseInt(timeA) - parseInt(timeB);
                  }).map((event) => (
                    <div
                      key={event._id}
                      className={`p-3 rounded-lg ${
                        activeEventId === event._id
                          ? 'bg-field-highlight/20 border-l-[3px] border-field-highlight'
                          : 'bg-field-bg'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-field-highlight font-medium text-sm w-12">
                          {event.time || '--:--'}
                        </div>
                        <div className="flex-1">
                          <div className="text-field-text font-medium">{event.title}</div>
                          {event.location && (
                            <div className="text-field-accent text-sm mt-1">{event.location}</div>
                          )}
                        </div>
                        {activeEventId === event._id && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-field-highlight text-field-bg animate-pulse">
                            {t('timelineView.nowIndicator')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        }
        shotListContent={<ShootList timeline={currentTimeline} fieldMode />}
        inspirationContent={<Inspiration timeline={currentTimeline} />}
        onExitWeddingMode={() => handleToggleFieldMode(false)}
      />
    );
  }

  return (
    <div className={`flex h-full ${fieldModeActive ? 'bg-field-bg' : 'bg-paper'}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
          style={isNative ? { paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' } : undefined}>
          <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:max-w-7xl lg:mx-auto">

        {/* Header */}
        <div className="border-[1.5px] border-ink bg-paper mb-4 sm:mb-6">
          {/* Back + title row */}
          <div className="px-4 sm:px-6 pt-4 pb-5 border-b-[1px] border-ink/15">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 mb-4"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              {t('timelineView.goBack')}
            </Button>

            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div>
                <p className="alto-label text-stone mb-1">LENZU · TIMELINE</p>
                <h1 className="font-display font-bold text-[26px] sm:text-[34px] tracking-[-0.03em] leading-none text-ink">
                  {currentTimeline.couple?.partner1 && currentTimeline.couple?.partner2
                    ? `${currentTimeline.couple.partner1} & ${currentTimeline.couple.partner2}`.toUpperCase()
                    : currentTimeline.title.toUpperCase()}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                  <div className="flex items-center gap-1.5 alto-label text-stone">
                    <Calendar size={13} strokeWidth={1.5} />
                    {formatDate(currentTimeline.weddingDate, i18n.language)}
                  </div>
                  {currentTimeline.location && (
                    <div className="flex items-center gap-1.5 alto-label text-stone">
                      <MapPin size={13} strokeWidth={1.5} />
                      {currentTimeline.location}
                    </div>
                  )}
                  <button
                    onClick={() => setIsCollaboratorsModalOpen(true)}
                    className="flex items-center gap-1.5 alto-label text-stone hover:text-ink transition-colors duration-[80ms]"
                  >
                    <Users size={13} strokeWidth={1.5} />
                    {t('dashboard.collaboratorsCount', { count: currentTimeline.collaborators.length + 1 })}
                  </button>
                  {/* Wedding Day Mode Button — without Pro it routes to the
                      upgrade flow: /my-plan (IAP) in native, /pricing on web. */}
                  {(
                    <button
                      onClick={() => {
                        if (!hasPro && !fieldModeActive) {
                          navigate(isNative ? '/my-plan' : '/pricing');
                          return;
                        }
                        handleToggleFieldMode(!fieldModeActive);
                      }}
                      className={`sm:ml-auto flex items-center gap-2 px-4 py-[10px] min-h-[44px] font-mono font-bold text-[11px] uppercase tracking-[0.08em] border transition-colors duration-[80ms] ${
                        fieldModeActive
                          ? 'border-field-accent text-field-accent bg-transparent hover:bg-field-accent/10'
                          : 'border-ink text-ink bg-transparent hover:bg-fog'
                      }`}
                    >
                      <Camera size={14} strokeWidth={1.5} />
                      {fieldModeActive ? t('timelineView.finishWeddingDay') : t('timelineView.startWeddingDay')}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center overflow-x-auto scrollbar-none">
            {(['overview', 'timeline', 'shotlist', 'inspiration'] as TabType[])
              // On native, hide the Inspiration tab entirely when the owner is
              // not Pro (no lock UI, no plan mention). Web keeps the tab.
              .filter((tab) => !(tab === 'inspiration' && isNative && !ownerHasPro))
              .map((tab) => {
              const icons: Record<TabType, React.ReactNode> = {
                overview: <Clipboard size={13} strokeWidth={1.5} />,
                timeline: <Calendar size={13} strokeWidth={1.5} />,
                shotlist: <Camera size={13} strokeWidth={1.5} />,
                inspiration: <Sparkles size={13} strokeWidth={1.5} />,
              };
              const labels: Record<TabType, string> = {
                overview: t('timelineView.overview'),
                timeline: t('timelineView.timeline'),
                shotlist: t('timelineView.shotLists'),
                inspiration: t('timelineView.inspiration'),
              };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-5 py-3 whitespace-nowrap border-r-[1px] border-ink/10 transition-colors duration-[80ms] ${
                    activeTab === tab
                      ? 'bg-ink text-paper'
                      : 'bg-transparent text-stone hover:text-ink hover:bg-fog'
                  } alto-label`}
                >
                  {icons[tab]}
                  {labels[tab].toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <Overview timeline={currentTimeline} />
        )}

        {activeTab === 'shotlist' && (
          <ShootList timeline={currentTimeline} />
        )}

        {activeTab === 'inspiration' && (
          ownerHasPro ? (
            <Inspiration timeline={currentTimeline} />
          ) : isNative ? (
            // Native + owner not Pro: tab is filtered out above; render nothing
            // as a safety guard (no lock, no plan mention).
            null
          ) : (
            // Web only: keep the blurred upgrade overlay (gated by owner plan).
            <div className="relative">
              <div className="pointer-events-none select-none opacity-30 blur-[2px]">
                <Inspiration timeline={currentTimeline} />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-paper/60">
                <div className="text-center max-w-xs">
                  <p className="font-mono font-bold text-[13px] text-ink uppercase tracking-[0.06em] mb-1">
                    {t('plans.upgradeTitle')}
                  </p>
                  <p className="font-mono text-[12px] text-stone leading-relaxed mb-4">
                    {t('plans.upgradeDesc')}
                  </p>
                  <Button variant="accent" onClick={() => navigate('/pricing')} arrow>
                    {t('plans.upgradeCta')}
                  </Button>
                </div>
              </div>
            </div>
          )
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4 sm:space-y-5">
            {/* Add Day / Export */}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => exportTimelinePDF(currentTimeline)}
                className="flex items-center gap-2"
              >
                <FileDown size={14} strokeWidth={1.5} />
                {t('timelineView.exportPDF')}
              </Button>
              <Button variant="accent" onClick={openAddDayModal} className="flex items-center gap-2" arrow>
                <Plus size={14} strokeWidth={2} />
                {t('timelineView.addDay')}
              </Button>
            </div>

            {sortedDays.length === 0 ? (
              <div className="border-[1.5px] border-ink bg-fog py-12 text-center">
                <p className="alto-label text-stone mb-4">{t('timelineView.noDays')}</p>
                <Button variant="accent" onClick={openAddDayModal} arrow>
                  {t('timelineView.addFirstDay')}
                </Button>
              </div>
            ) : (
              sortedDays.map((day) => {
                const isCollapsed = collapsedDays.has(day._id);
                const sortedEvents = sortDayEvents(day.events);

                return (
                  <div key={day._id} className="border-[1.5px] border-ink bg-fog overflow-hidden">
                    {/* Day Header */}
                    <div
                      className="flex items-center justify-between px-4 py-3 border-b-[1px] border-ink/20 cursor-pointer hover:bg-paper transition-colors duration-[80ms]"
                      onClick={() => toggleDayCollapse(day._id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ChevronRight
                          size={16}
                          strokeWidth={2}
                          className={`text-stone flex-shrink-0 transition-transform duration-[200ms] ${isCollapsed ? '' : 'rotate-90'}`}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-bold text-[15px] tracking-[-0.02em] text-ink">
                              {formatDate(day.date, i18n.language).toUpperCase()}
                            </h3>
                          </div>
                          {day.label && (
                            <p className="alto-label text-stone mt-0.5">{day.label.toUpperCase()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className="border-[1px] border-ink/30 px-2 py-0.5 font-mono text-[10px] text-stone">
                          {day.events.length}
                        </span>
                        {day.events.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSortChronologically(day)}
                            title={t('timelineView.sortChronologically')}
                          >
                            <ArrowDownUp size={13} strokeWidth={1.5} />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDayModal(day)}
                          title={t('timelineView.editDay')}
                        >
                          <Edit2 size={13} strokeWidth={1.5} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteDay(day._id, day.label || '')}
                          className="hover:text-brick"
                          title={t('timelineView.deleteDay')}
                        >
                          <Trash2 size={13} strokeWidth={1.5} />
                        </Button>
                      </div>
                    </div>

                    {/* Day Events */}
                    {!isCollapsed && (
                      <div className="p-4 space-y-3">
                        {/* Add Event Button */}
                        <button
                          onClick={() => openAddEventModal(day._id)}
                          className="w-full flex items-center justify-center gap-2 border-[1.5px] border-dashed border-ink/30 py-3 alto-label text-stone hover:text-ink hover:border-ink transition-colors duration-[80ms]"
                        >
                          <Plus size={13} strokeWidth={2} />
                          {t('timelineView.addEventToDay')}
                        </button>

                        {sortedEvents.length === 0 ? (
                          <p className="text-center alto-label text-stone py-4">{t('timelineView.noEventsInDay')}</p>
                        ) : (
                          sortedEvents.map((event) => {
                            const isActiveEvent = activeEventId === event._id;
                            return (
                              <div
                                key={event._id}
                                ref={isActiveEvent ? activeEventRef : undefined}
                                draggable
                                onDragStart={() => setDraggedEvent({ dayId: day._id, eventId: event._id })}
                                onDragEnd={() => { setDraggedEvent(null); setDragOverEventId(null); }}
                                onDragOver={(e) => {
                                  if (draggedEvent && draggedEvent.dayId === day._id && draggedEvent.eventId !== event._id) {
                                    e.preventDefault();
                                    setDragOverEventId(event._id);
                                  }
                                }}
                                onDragLeave={() => { if (dragOverEventId === event._id) setDragOverEventId(null); }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  handleEventDrop(day, event._id);
                                  setDraggedEvent(null);
                                  setDragOverEventId(null);
                                }}
                                className={`group relative border-[1px] bg-paper p-4 sm:p-5 transition-colors duration-[80ms] ${
                                  event.isCompleted ? 'opacity-60' : ''
                                } ${
                                  draggedEvent?.eventId === event._id ? 'opacity-40' : ''
                                } ${
                                  dragOverEventId === event._id ? 'outline outline-2 outline-lavender' : ''
                                } ${
                                  openEventMenuId === event._id
                                    ? 'border-[1px] border-ink bg-fog/70'
                                    : isActiveEvent
                                    ? 'border-l-[3px] border-lavender bg-lavender/5'
                                    : 'border-ink/15 hover:border-ink/30'
                                }`}
                              >
                                <div className="flex gap-4">
                                  {/* Drag handle */}
                                  <div
                                    className="flex-shrink-0 hidden sm:flex items-center -ml-2 cursor-grab active:cursor-grabbing text-stone/30 group-hover:text-stone transition-colors duration-[80ms]"
                                    title={t('timelineView.dragToReorder')}
                                  >
                                    <GripVertical size={15} strokeWidth={1.5} />
                                  </div>
                                  {/* Time */}
                                  <div className="flex-shrink-0 flex flex-col items-center w-14">
                                    {event.time ? (
                                      <div className="flex flex-col items-center gap-1">
                                        <div className={`font-mono font-bold text-[20px] leading-none ${
                                          isActiveEvent ? 'text-lavender' : 'text-ink'
                                        }`}>
                                          {event.time}
                                        </div>
                                        {isActiveEvent && (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 border-[1px] border-lavender bg-lavender/15 text-ink font-mono font-bold text-[8px] uppercase tracking-[0.08em] animate-pulse">
                                            {t('timelineView.nowIndicator')}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="font-mono text-[18px] font-bold text-stone">--:--</div>
                                    )}
                                  </div>

                                  {/* Checkbox */}
                                  <div className="flex-shrink-0">
                                    <button
                                      onClick={() => handleToggleCompletion(day._id, event._id)}
                                      className={`w-7 h-7 flex items-center justify-center border-[1.5px] transition-colors duration-[80ms] touch-manipulation ${
                                        event.isCompleted
                                          ? 'bg-ink border-ink text-paper'
                                          : 'border-ink/40 bg-transparent hover:border-ink'
                                      }`}
                                      title={event.isCompleted ? t('timelineView.markIncomplete') : t('timelineView.markComplete')}
                                    >
                                      {event.isCompleted ? <CheckCircle2 size={14} strokeWidth={2} /> : <Circle size={14} strokeWidth={1.5} className="text-stone" />}
                                    </button>
                                  </div>

                                  {/* Event Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <h4 className={`font-mono font-bold text-[13px] text-ink break-words ${
                                          event.isCompleted ? 'line-through text-stone' : ''
                                        }`}>{event.title}</h4>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                          <span className="border-[1px] border-ink/20 px-2 py-0.5 font-mono text-[10px] text-stone uppercase">
                                            {getCategoryLabel(event.category)}
                                          </span>
                                          {event.isCompleted && (
                                            <span className="border-[1px] border-moss/40 bg-moss/10 px-2 py-0.5 font-mono text-[10px] text-moss uppercase">
                                              {t('timelineView.completed')}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="relative flex-shrink-0" data-event-menu>
                                        <button
                                          onClick={() => setOpenEventMenuId(openEventMenuId === event._id ? null : event._id)}
                                          className="p-1.5 text-stone hover:text-ink hover:bg-fog transition-colors duration-[80ms]"
                                        >
                                          <MoreHorizontal size={15} strokeWidth={1.5} />
                                        </button>
                                        {openEventMenuId === event._id && (
                                          <div className="absolute right-0 top-full mt-0.5 w-40 bg-paper border-[1.5px] border-ink z-50 shadow-md">
                                            <button
                                              onClick={() => { setOpenEventMenuId(null); openEditEventModal(event, day._id); }}
                                              className="w-full flex items-center gap-2.5 px-3 py-2.5 font-mono text-[11px] text-ink hover:bg-fog transition-colors duration-[80ms] border-b border-ink/15"
                                            >
                                              <Edit2 size={12} strokeWidth={1.5} />
                                              {t('timelineView.editEvent')}
                                            </button>
                                            <button
                                              onClick={() => { setOpenEventMenuId(null); openNoteModal(event, day._id); }}
                                              className="w-full flex items-center gap-2.5 px-3 py-2.5 font-mono text-[11px] text-ink hover:bg-fog transition-colors duration-[80ms] border-b border-ink/15"
                                            >
                                              <MessageSquare size={12} strokeWidth={1.5} />
                                              {t('timelineView.addNote')}
                                            </button>
                                            <button
                                              onClick={() => { setOpenEventMenuId(null); handleDeleteEvent(day._id, event._id, event.title); }}
                                              className="w-full flex items-center gap-2.5 px-3 py-2.5 font-mono text-[11px] text-brick hover:bg-brick/5 transition-colors duration-[80ms]"
                                            >
                                              <Trash2 size={12} strokeWidth={1.5} />
                                              {t('timelineView.deleteEvent')}
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {event.description && (
                                      <p className={`font-mono text-[11px] mt-2 break-words leading-relaxed ${
                                        event.isCompleted ? 'text-stone line-through' : 'text-stone'
                                      }`}>{event.description}</p>
                                    )}

                                    {event.location && (
                                      <div className="flex items-center gap-1.5 mt-2 alto-label text-stone">
                                        <MapPin size={12} strokeWidth={1.5} />
                                        {event.location}
                                      </div>
                                    )}

                                    {/* Countdown Timer */}
                                    {!event.isCompleted && day.date && event.time && (
                                      <div className="mt-2">
                                        <CountdownTimer
                                          targetDate={`${new Date(day.date).toISOString().split('T')[0]}T${event.time}`}
                                          showIcon
                                        />
                                      </div>
                                    )}

                                    {/* Notes */}
                                    {event.notes && event.notes.length > 0 && (
                                      <div className="mt-3 space-y-2">
                                        <p className="alto-label text-stone flex items-center gap-1">
                                          <MessageSquare size={11} strokeWidth={1.5} />
                                          {t('timelineView.notes', { count: event.notes.length })}
                                        </p>
                                        {event.notes.map((note) => (
                                          <div key={note._id} className="border-[1px] border-ink/15 bg-fog p-2">
                                            <div className="flex items-start gap-2">
                                              <div className="w-6 h-6 bg-ink text-paper flex items-center justify-center font-mono font-bold text-[9px] flex-shrink-0">
                                                {getInitials(note.author?.name || '')}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                  <span className="font-mono font-bold text-[11px] text-ink">
                                                    {note.author?.name}
                                                  </span>
                                                  <span className="alto-label text-stone shrink-0">
                                                    {formatDateTime(note.createdAt, i18n.language)}
                                                  </span>
                                                </div>
                                                <p className="font-mono text-[11px] text-stone mt-0.5 leading-relaxed">{note.content}</p>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Change Logs */}
                                    {event.changeLogs && event.changeLogs.length > 0 && (
                                      <details className="mt-3">
                                        <summary className="alto-label text-stone cursor-pointer flex items-center gap-1">
                                          <History size={11} strokeWidth={1.5} />
                                          {t('timelineView.changeHistory', { count: event.changeLogs.length })}
                                        </summary>
                                        <div className="mt-1 space-y-1 border-l-[1px] border-ink/15 pl-3 ml-1">
                                          {event.changeLogs.map((log) => (
                                            <div key={log._id} className="font-mono text-[10px] text-stone flex items-center gap-1 flex-wrap">
                                              <span className="font-bold">{log.user?.name}</span>
                                              <span>·</span>
                                              <span>{log.description || log.action}</span>
                                              <span>·</span>
                                              <span>{formatDateTime(log.timestamp, i18n.language)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Event Modal */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={isEditingEvent ? t('timelineView.editEvent') : t('timelineView.addEvent')}
        size="lg"
      >
        <form onSubmit={handleAddEvent} className="space-y-4">
          <Input
            label={t('timelineView.eventTitle')}
            placeholder={t('timelineView.eventTitlePlaceholder')}
            value={eventFormData.title}
            onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
            required
          />

          <div className="flex flex-col gap-[6px]">
            <span className="alto-label text-ink">{t('timelineView.category')}</span>
            <select
              className="w-full border-[1.5px] border-ink bg-paper px-[14px] py-[12px] font-mono font-bold text-[13px] text-ink focus:outline-none focus:outline-[2px] focus:outline-lavender"
              value={eventFormData.category}
              onChange={(e) => setEventFormData({ ...eventFormData, category: e.target.value as Event['category'] })}
            >
              <option value="ceremony">{t('timelineView.categoryCeremony')}</option>
              <option value="reception">{t('timelineView.categoryReception')}</option>
              <option value="preparation">{t('timelineView.categoryPreparation')}</option>
              <option value="photography">{t('timelineView.categoryPhotography')}</option>
              <option value="other">{t('timelineView.categoryOther')}</option>
            </select>
          </div>

          <Input
            type="time"
            label={t('timelineView.time')}
            value={eventFormData.time}
            onChange={(e) => setEventFormData({ ...eventFormData, time: e.target.value })}
          />

          <Input
            label={t('timelineView.location')}
            placeholder={t('timelineView.locationPlaceholder')}
            value={eventFormData.location}
            onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
          />

          <div className="flex flex-col gap-[6px]">
            <span className="alto-label text-ink">{t('timelineView.description')}</span>
            <textarea
              className="w-full border-[1.5px] border-ink bg-paper px-[14px] py-[12px] font-mono text-[13px] text-ink focus:outline-none focus:outline-[2px] focus:outline-lavender placeholder:text-stone placeholder:font-normal resize-none"
              rows={3}
              placeholder={t('timelineView.descriptionPlaceholder')}
              value={eventFormData.description}
              onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsEventModalOpen(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="accent" className="flex-1" arrow>
              {isEditingEvent ? t('timelineView.saveChanges') : t('timelineView.addEvent')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setSelectedEvent(null);
          setNoteContent('');
        }}
        title={t('timelineView.addNoteTitle', { title: selectedEvent?.title })}
      >
        <form onSubmit={handleAddNote} className="space-y-4">
          <div className="flex flex-col gap-[6px]">
            <span className="alto-label text-ink">{t('timelineView.note')}</span>
            <textarea
              className="w-full border-[1.5px] border-ink bg-paper px-[14px] py-[12px] font-mono text-[13px] text-ink focus:outline-none focus:outline-[2px] focus:outline-lavender placeholder:text-stone placeholder:font-normal resize-none"
              rows={4}
              placeholder={t('timelineView.notePlaceholder')}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsNoteModalOpen(false);
                setSelectedEvent(null);
                setNoteContent('');
              }}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="accent" className="flex-1" arrow>
              {t('timelineView.addNote')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Day Modal */}
      <Modal
        isOpen={isDayModalOpen}
        onClose={() => {
          setIsDayModalOpen(false);
          setIsEditingDay(false);
          setSelectedDay(null);
          setDayFormData({ date: '', label: '' });
        }}
        title={isEditingDay ? t('timelineView.editDay') : t('timelineView.addDay')}
      >
        <form onSubmit={isEditingDay ? handleUpdateDay : handleAddDay} className="space-y-4">
          <Input
            type="date"
            label={t('timelineView.dayDate')}
            value={dayFormData.date}
            onChange={(e) => setDayFormData({ ...dayFormData, date: e.target.value })}
            required
          />

          <Input
            label={t('timelineView.dayLabel')}
            placeholder={t('timelineView.dayLabelPlaceholder')}
            value={dayFormData.label}
            onChange={(e) => setDayFormData({ ...dayFormData, label: e.target.value })}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsDayModalOpen(false);
                setIsEditingDay(false);
                setSelectedDay(null);
                setDayFormData({ date: '', label: '' });
              }}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="accent" className="flex-1" arrow>
              {isEditingDay ? t('timelineView.saveChanges') : t('timelineView.addDay')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Collaborators Modal */}
      <CollaboratorsModal
        isOpen={isCollaboratorsModalOpen}
        onClose={() => setIsCollaboratorsModalOpen(false)}
        timeline={currentTimeline}
      />

          </div>
        </div>
      </div>
  );
}
