import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Calendar, Clock, MapPin, MessageSquare, History, Users, ArrowLeft } from 'lucide-react';
import { useTimelineStore } from '@/store/timelineStore';
import { useAuthStore } from '@/store/authStore';
import { useInvitationsStore } from '@/store/invitationsStore';
import { Event } from '@/types';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { formatDate, formatDateTime, getCategoryColor, getCategoryLabel, getInitials } from '@/lib/utils';

export default function TimelineView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTimeline, fetchTimeline, addEvent, addNote, isLoading } = useTimelineStore();
  const { user } = useAuthStore();
  const { inviteGuest, createInviteLink } = useInvitationsStore();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
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

  useEffect(() => {
    if (id) {
      fetchTimeline(id);
    }
  }, [id, fetchTimeline]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await addEvent(id, eventFormData);
      setIsEventModalOpen(false);
      setEventFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        category: 'other',
      });
    } catch (error) {
      console.error('Error adding event:', error);
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
    // Prefill date with timeline weddingDate (YYYY-MM-DD)
    const defaultDate = currentTimeline
      ? new Date(currentTimeline.weddingDate).toISOString().slice(0, 10)
      : '';
    setEventFormData((prev) => ({ ...prev, date: prev.date || defaultDate }));
    setIsEventModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600">Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (!currentTimeline) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600">Timeline not found</p>
        </div>
      </div>
    );
  }

  const sortedEvents = [...currentTimeline.events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentTimeline.couple?.partner1 && currentTimeline.couple?.partner2
                  ? `${currentTimeline.couple.partner1} & ${currentTimeline.couple.partner2}`
                  : currentTimeline.title}
              </h1>
              {currentTimeline.description && (
                <p className="text-gray-600 mt-2">{currentTimeline.description}</p>
              )}
              <div className="flex items-center space-x-4 mt-4 text-sm text-gray-600">
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
                <div className="flex items-center">
                  <Users size={16} className="mr-2" />
                  {currentTimeline.collaborators.length + 1} collaborators
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={openAddEventModal}>
                <Plus size={20} className="mr-2" />
                Add Event
              </Button>
              {canInvite && (
                <div className="flex items-center space-x-2">
                  <form onSubmit={handleInvite} className="flex items-center space-x-2 w-[320px]">
                    <Input
                      type="email"
                      placeholder="Invite guest by email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                    <Button type="submit">Invite</Button>
                  </form>
                  <Button variant="outline" onClick={handleCopyLink}>Copy link</Button>
                  {inviteStatus && (
                    <div className="text-sm text-gray-600 mt-2">{inviteStatus}</div>
                  )}
                  {copyStatus && (
                    <div className="text-sm text-gray-600 mt-2">{copyStatus}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Events Timeline */}
        <div className="space-y-6">
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
              <Card key={event._id} className="relative">
                {index !== sortedEvents.length - 1 && (
                  <div className="absolute left-8 top-full h-6 w-0.5 bg-gray-200" />
                )}
                <CardContent className="p-6">
                  <div className="flex">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <Calendar className="text-primary-600" size={24} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getCategoryColor(event.category)}`}>
                            {getCategoryLabel(event.category)}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openNoteModal(event)}
                        >
                          <MessageSquare size={16} className="mr-1" />
                          Note
                        </Button>
                      </div>

                      {event.description && (
                        <p className="text-gray-600 mt-2">{event.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
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
      </div>

      {/* Add Event Modal */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title="Add New Event"
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
              Add Event
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
    </div>
  );
}
