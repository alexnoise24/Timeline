import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Calendar, Clock, MapPin, MessageSquare, History, Users, ArrowLeft, Clipboard, Camera, Edit2, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { useTimelineStore } from '@/store/timelineStore';
import { useAuthStore } from '@/store/authStore';
import { useInvitationsStore } from '@/store/invitationsStore';
import { Event } from '@/types';
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTimeline, fetchTimeline, addEvent, updateEvent, deleteEvent, toggleEventCompletion, addNote, isLoading } = useTimelineStore();
  const { user } = useAuthStore();
  const { inviteGuest, createInviteLink } = useInvitationsStore();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'other' as Event['category'],
  });
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

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      if (isEditingEvent && selectedEvent) {
        // Update existing event
        await updateEvent(id, selectedEvent._id, eventFormData);
      } else {
        // Add new event
        await addEvent(id, eventFormData);
      }
      setIsEventModalOpen(false);
      setIsEditingEvent(false);
      setSelectedEvent(null);
      setEventFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        category: 'other',
      });
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const openEditEventModal = (event: Event) => {
    setSelectedEvent(event);
    setIsEditingEvent(true);
    setEventFormData({
      title: event.title,
      description: event.description || '',
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
      time: event.time || '',
      location: event.location || '',
      category: event.category,
    });
    setIsEventModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!id) return;
    if (!window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) return;

    try {
      await deleteEvent(id, eventId);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleToggleCompletion = async (eventId: string) => {
    if (!id) return;
    try {
      await toggleEventCompletion(id, eventId);
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
      setCopyStatus('Link copied');
      setTimeout(() => setCopyStatus(null), 2000);
    } catch (err: any) {
      setCopyStatus('Failed to copy link');
      setTimeout(() => setCopyStatus(null), 2500);
    }
  };

  const canInvite = !!(user && currentTimeline && user.role === 'photographer' && currentTimeline.owner && currentTimeline.owner._id === user._id);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !inviteEmail.trim()) return;
    try {
      await inviteGuest(id, inviteEmail.trim());
      setInviteStatus('Invitation sent');
      setInviteEmail('');
      setTimeout(() => setInviteStatus(null), 3000);
    } catch (err: any) {
      setInviteStatus(err?.response?.data?.message || 'Failed to send invitation');
      setTimeout(() => setInviteStatus(null), 4000);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedEvent || !noteContent.trim()) return;

    try {
      await addNote(id, selectedEvent._id, noteContent);
      setNoteContent('');
      setIsNoteModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const openNoteModal = (event: Event) => {
    setSelectedEvent(event);
    setIsNoteModalOpen(true);
  };

  const openAddEventModal = () => {
    setIsEditingEvent(false);
    setSelectedEvent(null);
    // Prefill date with timeline weddingDate (YYYY-MM-DD)
    const defaultDate = currentTimeline
      ? new Date(currentTimeline.weddingDate).toISOString().slice(0, 10)
      : '';
    setEventFormData({
      title: '',
      description: '',
      date: defaultDate,
      time: '',
      location: '',
      category: 'other',
    });
    setIsEventModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-600">Loading timeline...</p>
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
            <p className="text-gray-600">Timeline not found</p>
          </div>
        </div>
      </div>
    );
  }

  const sortedEvents = [...currentTimeline.events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
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
              Go back to timelines
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
                  {formatDate(currentTimeline.weddingDate)}
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
                    {currentTimeline.collaborators.length + 1} collaborators
                  </span>
                </button>
              </div>
            </div>
            {canInvite && activeTab === 'timeline' && (
              <div className="w-full lg:w-auto">
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Input
                    type="email"
                    placeholder="Invite guest by email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="flex-1 sm:w-64"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 sm:flex-none">Invite</Button>
                    <Button variant="outline" onClick={handleCopyLink} className="flex-1 sm:flex-none">Copy link</Button>
                  </div>
                </form>
                {(inviteStatus || copyStatus) && (
                  <div className="text-xs sm:text-sm text-gray-600 mt-2">{inviteStatus || copyStatus}</div>
                )}
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 sm:gap-3 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clipboard size={16} className="sm:w-[18px] sm:h-[18px]" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === 'timeline'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" />
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('shotlist')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === 'shotlist'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Camera size={16} className="sm:w-[18px] sm:h-[18px]" />
              Shot Lists
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
            {/* Add Event Button */}
            <div className="flex justify-end">
              <Button onClick={openAddEventModal} className="flex items-center gap-2 w-full sm:w-auto justify-center">
                <Plus size={18} />
                Add Event
              </Button>
            </div>
          {sortedEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 mb-4">There are no events in this timeline</p>
                <Button onClick={() => setIsEventModalOpen(true)}>
                  Add first event
                </Button>
              </CardContent>
            </Card>
          ) : (
            sortedEvents.map((event, index) => (
              <Card key={event._id} className={`relative ${event.isCompleted ? 'opacity-75 bg-gray-50' : ''}`}>
                {index !== sortedEvents.length - 1 && (
                  <div className="absolute left-8 top-full h-6 w-0.5 bg-gray-200" />
                )}
                <CardContent className="p-4 sm:p-6">
                  <div className="flex">
                    <div className="flex-shrink-0 mr-3 sm:mr-4">
                      <button
                        onClick={() => handleToggleCompletion(event._id)}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors ${
                          event.isCompleted
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                        }`}
                        title={event.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {event.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0">
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-base sm:text-xl font-semibold text-gray-900 break-words ${
                            event.isCompleted ? 'line-through text-gray-500' : ''
                          }`}>{event.title}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(event.category)}`}>
                              {getCategoryLabel(event.category)}
                            </span>
                            {event.isCompleted && (
                              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                ✓ Completed
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditEventModal(event)}
                            title="Edit event"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteEvent(event._id, event.title)}
                            className="text-red-600 hover:bg-red-50"
                            title="Delete event"
                          >
                            <Trash2 size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openNoteModal(event)}
                            title="Add note"
                          >
                            <MessageSquare size={16} />
                          </Button>
                        </div>
                      </div>

                      {event.description && (
                        <p className={`text-sm sm:text-base mt-2 break-words ${
                          event.isCompleted ? 'text-gray-500 line-through' : 'text-gray-600'
                        }`}>{event.description}</p>
                      )}

                      <div className="flex flex-wrap gap-3 sm:gap-4 mt-3 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar size={16} className="mr-2" />
                          {formatDate(event.date)}
                        </div>
                        {event.time && (
                          <div className="flex items-center">
                            <Clock size={16} className="mr-2" />
                            {event.time}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center">
                            <MapPin size={16} className="mr-2" />
                            {event.location}
                          </div>
                        )}
                      </div>

                      {/* Countdown Timer */}
                      {!event.isCompleted && event.date && event.time && (
                        <div className="mt-3">
                          <CountdownTimer 
                            targetDate={`${event.date.split('T')[0]}T${event.time}`} 
                            showIcon 
                          />
                        </div>
                      )}

                      {/* Notes */}
                      {event.notes.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="text-sm font-medium text-gray-700 flex items-center">
                            <MessageSquare size={16} className="mr-1" />
                            Notes ({event.notes.length})
                          </h4>
                          {event.notes.map((note) => (
                            <div key={note._id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-start space-x-2">
                                <div className="w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-xs font-medium text-primary-700">
                                  {getInitials(note.author.name)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-900">
                                      {note.author.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatDateTime(note.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 mt-1">{note.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Change Logs */}
                      {event.changeLogs.length > 0 && (
                        <details className="mt-4">
                          <summary className="text-sm font-medium text-gray-700 cursor-pointer flex items-center">
                            <History size={16} className="mr-1" />
                            Change history ({event.changeLogs.length})
                          </summary>
                          <div className="mt-2 space-y-1">
                            {event.changeLogs.map((log) => (
                              <div key={log._id} className="text-xs text-gray-600 flex items-center">
                                <span className="font-medium">{log.user.name}</span>
                                <span className="mx-1">•</span>
                                <span>{log.description || log.action}</span>
                                <span className="mx-1">•</span>
                                <span>{formatDateTime(log.timestamp)}</span>
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

      {/* Add/Edit Event Modal */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={isEditingEvent ? "Edit Event" : "Add Event"}
        size="lg"
      >
        <form onSubmit={handleAddEvent} className="space-y-4">
          <Input
            label="Event Title"
            placeholder="e.g., Ceremony, Reception, etc."
            value={eventFormData.title}
            onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={eventFormData.category}
              onChange={(e) => setEventFormData({ ...eventFormData, category: e.target.value as Event['category'] })}
            >
              <option value="ceremony">Ceremony</option>
              <option value="reception">Reception</option>
              <option value="preparation">Preparation</option>
              <option value="photography">Photography</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Date"
              value={eventFormData.date}
              onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
              required
            />
            <Input
              type="time"
              label="Time"
              value={eventFormData.time}
              onChange={(e) => setEventFormData({ ...eventFormData, time: e.target.value })}
            />
          </div>

          <Input
            label="Location (optional)"
            placeholder="e.g., San Jose Church"
            value={eventFormData.location}
            onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Describe the event..."
              value={eventFormData.description}
              onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
            />
          </div>

          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsEventModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {isEditingEvent ? "Save Changes" : "Add Event"}
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
        title={`Add Note - ${selectedEvent?.title}`}
      >
        <form onSubmit={handleAddNote} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={4}
              placeholder="Write your note here..."
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
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Note
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
