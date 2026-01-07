import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Calendar, MapPin, MessageSquare, History, Users, ArrowLeft, Clipboard, Camera, Edit2, Trash2, CheckCircle2, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { useTimelineStore } from '@/store/timelineStore';
import { useAuthStore } from '@/store/authStore';
import { useInvitationsStore } from '@/store/invitationsStore';
import { Event, Day } from '@/types';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import CountdownTimer from '@/components/CountdownTimer';
import { formatDate, formatDateTime, getCategoryColor, getCategoryLabel, getInitials } from '@/lib/utils';
import Overview from '@/components/Overview';
import ShootList from '@/components/ShootList';
import Sidebar from '@/components/Sidebar';
import CollaboratorsModal from '@/components/CollaboratorsModal';

type TabType = 'overview' | 'timeline' | 'shotlist';

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
    isLoading 
  } = useTimelineStore();
  const { user } = useAuthStore();
  const { inviteGuest, createInviteLink } = useInvitationsStore();
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
  // Day modal state
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isEditingDay, setIsEditingDay] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const [dayFormData, setDayFormData] = useState({
    date: '',
    label: '',
  });
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isCollaboratorsModalOpen, setIsCollaboratorsModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTimeline(id);
    }
  }, [id, fetchTimeline]);

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

  const handleCopyLink = async () => {
    if (!id) return;
    try {
      const token = await createInviteLink(id);
      const url = `${window.location.origin}/invite/${token}`;
      await navigator.clipboard.writeText(url);
      setCopyStatus(t('timelineView.linkCopied'));
      setTimeout(() => setCopyStatus(null), 2000);
    } catch (err: any) {
      setCopyStatus(t('timelineView.linkCopyFailed'));
      setTimeout(() => setCopyStatus(null), 2500);
    }
  };

  const canInvite = !!(user && currentTimeline && user.role === 'photographer' && currentTimeline.owner && currentTimeline.owner._id === user._id);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !inviteEmail.trim()) return;
    try {
      await inviteGuest(id, inviteEmail.trim());
      setInviteStatus(t('timelineView.invitationSent'));
      setInviteEmail('');
      setTimeout(() => setInviteStatus(null), 3000);
    } catch (err: any) {
      setInviteStatus(err?.response?.data?.message || t('timelineView.invitationFailed'));
      setTimeout(() => setInviteStatus(null), 4000);
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

  const openNoteModal = (event: Event, dayId: string) => {
    setSelectedEvent(event);
    setSelectedDayId(dayId);
    setIsNoteModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-600">{t('timelineView.loadingTimeline')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentTimeline) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-600">{t('timelineView.timelineNotFound')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Sort days by date and events within each day by time
  const sortedDays = [...(currentTimeline.days || [])].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="mb-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              {t('timelineView.goBack')}
            </Button>
          </div>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {currentTimeline.couple?.partner1 && currentTimeline.couple?.partner2
                  ? `${currentTimeline.couple.partner1} & ${currentTimeline.couple.partner2}`
                  : currentTimeline.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2" />
                  {formatDate(currentTimeline.weddingDate, i18n.language)}
                </div>
                {currentTimeline.location && (
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2" />
                    {currentTimeline.location}
                  </div>
                )}
                <button
                  onClick={() => setIsCollaboratorsModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <Users size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {t('dashboard.collaboratorsCount', { count: currentTimeline.collaborators.length + 1 })}
                  </span>
                </button>
              </div>
            </div>
            {canInvite && activeTab === 'timeline' && (
              <div className="w-full lg:w-auto">
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Input
                    type="email"
                    placeholder={t('timelineView.inviteByEmail')}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="flex-1 sm:w-64"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 sm:flex-none">{t('timelineView.invite')}</Button>
                    <Button variant="outline" onClick={handleCopyLink} className="flex-1 sm:flex-none">{t('timelineView.copyLink')}</Button>
                  </div>
                </form>
                {(inviteStatus || copyStatus) && (
                  <div className="text-xs sm:text-sm text-gray-600 mt-2">{inviteStatus || copyStatus}</div>
                )}
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto pb-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-all rounded-lg whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-black text-white'
                  : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Clipboard size={16} className="sm:w-[18px] sm:h-[18px]" />
              {t('timelineView.overview')}
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-all rounded-lg whitespace-nowrap ${
                activeTab === 'timeline'
                  ? 'bg-black text-white'
                  : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" />
              {t('timelineView.timeline')}
            </button>
            <button
              onClick={() => setActiveTab('shotlist')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-all rounded-lg whitespace-nowrap ${
                activeTab === 'shotlist'
                  ? 'bg-black text-white'
                  : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Camera size={16} className="sm:w-[18px] sm:h-[18px]" />
              {t('timelineView.shotLists')}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <Overview timeline={currentTimeline} />
        )}

        {activeTab === 'shotlist' && (
          <ShootList timeline={currentTimeline} />
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Add Day Button */}
            <div className="flex justify-end gap-2">
              <Button onClick={openAddDayModal} variant="outline" className="flex items-center gap-2">
                <Plus size={18} />
                {t('timelineView.addDay')}
              </Button>
            </div>

            {sortedDays.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600 mb-4">{t('timelineView.noDays')}</p>
                  <Button onClick={openAddDayModal}>
                    {t('timelineView.addFirstDay')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              sortedDays.map((day) => {
                const isCollapsed = collapsedDays.has(day._id);
                const sortedEvents = [...day.events].sort((a, b) => {
                  const timeA = a.time || '00:00';
                  const timeB = b.time || '00:00';
                  return timeA.localeCompare(timeB);
                });

                return (
                  <div key={day._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Day Header */}
                    <div 
                      className="flex items-center justify-between p-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleDayCollapse(day._id)}
                    >
                      <div className="flex items-center gap-3">
                        <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                          {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-accent" />
                            <h3 className="font-heading text-lg font-semibold text-gray-900">
                              {formatDate(day.date, i18n.language)}
                            </h3>
                          </div>
                          {day.label && (
                            <span className="text-sm text-gray-600 ml-7">{day.label}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-sm text-gray-500">
                          {day.events.length} {day.events.length === 1 ? t('timelineView.event') : t('timelineView.events')}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDayModal(day)}
                          title={t('timelineView.editDay')}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDay(day._id, day.label || '')}
                          className="text-red-600 hover:bg-red-50"
                          title={t('timelineView.deleteDay')}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    {/* Day Events */}
                    {!isCollapsed && (
                      <div className="p-4 space-y-4">
                        {/* Add Event to Day Button */}
                        <Button 
                          onClick={() => openAddEventModal(day._id)} 
                          variant="outline" 
                          className="w-full flex items-center justify-center gap-2 border-dashed"
                        >
                          <Plus size={16} />
                          {t('timelineView.addEventToDay')}
                        </Button>

                        {sortedEvents.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">{t('timelineView.noEventsInDay')}</p>
                        ) : (
                          sortedEvents.map((event, index) => (
                            <Card key={event._id} className={`relative ${event.isCompleted ? 'opacity-75 bg-gray-50' : ''}`}>
                              {index !== sortedEvents.length - 1 && (
                                <div className="absolute left-[90px] top-full h-4 w-0.5 bg-gray-200" />
                              )}
                              <CardContent className="p-4">
                                <div className="flex gap-4">
                                  {/* Time Display */}
                                  <div className="flex-shrink-0 flex flex-col items-center">
                                    {event.time ? (
                                      <div className="text-2xl sm:text-3xl font-bold text-accent">
                                        {event.time}
                                      </div>
                                    ) : (
                                      <div className="text-xl sm:text-2xl font-medium text-gray-400">--:--</div>
                                    )}
                                  </div>

                                  {/* Checkbox */}
                                  <div className="flex-shrink-0">
                                    <button
                                      onClick={() => handleToggleCompletion(day._id, event._id)}
                                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors touch-manipulation ${
                                        event.isCompleted
                                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                          : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                                      }`}
                                      title={event.isCompleted ? t('timelineView.markIncomplete') : t('timelineView.markComplete')}
                                    >
                                      {event.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                    </button>
                                  </div>

                                  {/* Event Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <h4 className={`text-base font-semibold text-gray-900 break-words ${
                                          event.isCompleted ? 'line-through text-gray-500' : ''
                                        }`}>{event.title}</h4>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(event.category)}`}>
                                            {getCategoryLabel(event.category)}
                                          </span>
                                          {event.isCompleted && (
                                            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                              ✓ {t('timelineView.completed')}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-1 flex-shrink-0">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => openEditEventModal(event, day._id)}
                                          title={t('timelineView.editEvent')}
                                        >
                                          <Edit2 size={14} />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleDeleteEvent(day._id, event._id, event.title)}
                                          className="text-red-600 hover:bg-red-50"
                                          title={t('timelineView.deleteEvent')}
                                        >
                                          <Trash2 size={14} />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => openNoteModal(event, day._id)}
                                          title={t('timelineView.addNote')}
                                        >
                                          <MessageSquare size={14} />
                                        </Button>
                                      </div>
                                    </div>

                                    {event.description && (
                                      <p className={`text-sm mt-2 break-words ${
                                        event.isCompleted ? 'text-gray-500 line-through' : 'text-gray-600'
                                      }`}>{event.description}</p>
                                    )}

                                    {event.location && (
                                      <div className="flex items-center mt-2 text-xs text-gray-600">
                                        <MapPin size={14} className="mr-1" />
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
                                        <h5 className="text-xs font-medium text-gray-700 flex items-center">
                                          <MessageSquare size={14} className="mr-1" />
                                          {t('timelineView.notes', { count: event.notes.length })}
                                        </h5>
                                        {event.notes.map((note) => (
                                          <div key={note._id} className="bg-gray-50 rounded-lg p-2">
                                            <div className="flex items-start space-x-2">
                                              <div className="w-6 h-6 rounded-full bg-primary-200 flex items-center justify-center text-xs font-medium text-primary-700">
                                                {getInitials(note.author?.name || '')}
                                              </div>
                                              <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-xs font-medium text-gray-900">
                                                    {note.author?.name}
                                                  </span>
                                                  <span className="text-xs text-gray-500">
                                                    {formatDateTime(note.createdAt, i18n.language)}
                                                  </span>
                                                </div>
                                                <p className="text-xs text-gray-700 mt-0.5">{note.content}</p>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Change Logs */}
                                    {event.changeLogs && event.changeLogs.length > 0 && (
                                      <details className="mt-3">
                                        <summary className="text-xs font-medium text-gray-700 cursor-pointer flex items-center">
                                          <History size={14} className="mr-1" />
                                          {t('timelineView.changeHistory', { count: event.changeLogs.length })}
                                        </summary>
                                        <div className="mt-1 space-y-1">
                                          {event.changeLogs.map((log) => (
                                            <div key={log._id} className="text-xs text-gray-600 flex items-center">
                                              <span className="font-medium">{log.user?.name}</span>
                                              <span className="mx-1">•</span>
                                              <span>{log.description || log.action}</span>
                                              <span className="mx-1">•</span>
                                              <span>{formatDateTime(log.timestamp, i18n.language)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('timelineView.category')}
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('timelineView.description')}
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder={t('timelineView.descriptionPlaceholder')}
              value={eventFormData.description}
              onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
            />
          </div>

          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsEventModalOpen(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('timelineView.note')}
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={4}
              placeholder={t('timelineView.notePlaceholder')}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              required
            />
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsNoteModalOpen(false);
                setSelectedEvent(null);
                setNoteContent('');
              }}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1">
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

          <div className="flex space-x-3">
            <Button 
              type="button" 
              variant="outline" 
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
            <Button type="submit" className="flex-1">
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
