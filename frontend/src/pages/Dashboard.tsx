import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Calendar, Users, LogOut, UserPlus, Share2, Bell, Trash2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import InviteModal from '@/components/InviteModal';
import Sidebar from '@/components/Sidebar';
import CountdownTimer from '@/components/CountdownTimer';
import { useAuthStore } from '@/store/authStore';
import { useTimelineStore } from '@/store/timelineStore';
import { useInvitationsStore } from '@/store/invitationsStore';
import { requestNotificationPermission, isNotificationSupported } from '@/lib/notifications';

// Local helper interface for form only
interface NewProjectForm {
  title: string;
  description: string;
  date: string; // yyyy-mm-dd
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { timelines, createTimeline, fetchTimelines, deleteTimeline, isLoading } = useTimelineStore();
  const { invitations, fetchMyInvitations, acceptInvitation, declineInvitation } = useInvitationsStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTimelineForInvite, setSelectedTimelineForInvite] = useState<{ id: string; title: string } | null>(null);
  const [selectedTimelineForDelete, setSelectedTimelineForDelete] = useState<{ id: string; title: string } | null>(null);
  const [newProject, setNewProject] = useState<NewProjectForm>({
    title: '',
    description: '',
    date: ''
  });

  const showError = (message: string) => {
    toast.error(message, {
      duration: 5000,
      position: 'top-center',
    });
  };

  useEffect(() => {
    if (user) {
      fetchTimelines();
      fetchMyInvitations(); // Fetch for all users
    }
  }, [user, fetchTimelines, fetchMyInvitations]);

  // Request notification permission automatically on first visit
  useEffect(() => {
    const requestNotifications = async () => {
      // Check if we've already asked before
      const hasAskedBefore = localStorage.getItem('notification-permission-requested');
      
      if (!hasAskedBefore && isNotificationSupported() && Notification.permission === 'default') {
        // Wait a bit so user sees the dashboard first
        setTimeout(async () => {
          await requestNotificationPermission();
          // Mark that we've asked, regardless of the result
          localStorage.setItem('notification-permission-requested', 'true');
        }, 2000); // Wait 2 seconds after dashboard loads
      }
    };

    if (user) {
      requestNotifications();
    }
  }, [user]);

  const handleOpenInviteModal = (timelineId: string, timelineTitle: string) => {
    setSelectedTimelineForInvite({ id: timelineId, title: timelineTitle });
    setIsInviteModalOpen(true);
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
    setSelectedTimelineForInvite(null);
  };

  // Separate owned and shared timelines
  const ownedTimelines = timelines.filter(t => t && t.owner && user && t.owner._id === user._id);
  const sharedTimelines = timelines.filter(t => t && t.owner && user && t.owner._id !== user._id);
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  // Group timelines by month
  const groupTimelinesByMonth = (timelineList: typeof timelines) => {
    const grouped: { [key: string]: typeof timelines } = {};
    
    timelineList.forEach(timeline => {
      if (timeline.weddingDate) {
        const date = new Date(timeline.weddingDate);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!grouped[monthYear]) {
          grouped[monthYear] = [];
        }
        grouped[monthYear].push(timeline);
      }
    });

    // Sort by date within each month
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => 
        new Date(a.weddingDate!).getTime() - new Date(b.weddingDate!).getTime()
      );
    });

    // Sort months chronologically
    const sortedKeys = Object.keys(grouped).sort();
    const sortedGrouped: { [key: string]: typeof timelines } = {};
    sortedKeys.forEach(key => {
      sortedGrouped[key] = grouped[key];
    });

    return sortedGrouped;
  };

  const getMonthLabel = (monthYearKey: string) => {
    const [year, month] = monthYearKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  const groupedOwnedTimelines = groupTimelinesByMonth(ownedTimelines);
  const groupedSharedTimelines = groupTimelinesByMonth(sharedTimelines);

  const handleAcceptInvitation = async (timelineId: string) => {
    try {
      await acceptInvitation(timelineId);
      // Refresh timelines to show the newly accepted timeline
      await fetchTimelines();
      toast.success('Invitation accepted!');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      showError('Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (timelineId: string) => {
    try {
      await declineInvitation(timelineId);
      toast.success('Invitation declined');
    } catch (error) {
      console.error('Error declining invitation:', error);
      showError('Failed to decline invitation');
    }
  };

  const handleOpenDeleteModal = (timelineId: string, timelineTitle: string) => {
    setSelectedTimelineForDelete({ id: timelineId, title: timelineTitle });
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedTimelineForDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTimelineForDelete) return;

    try {
      await deleteTimeline(selectedTimelineForDelete.id);
      toast.success('Timeline deleted successfully');
      handleCloseDeleteModal();
    } catch (error) {
      console.error('Error deleting timeline:', error);
      showError('Failed to delete timeline');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (!newProject.title.trim()) {
        showError('Project title is required');
        return;
      }

      // Fix timezone issue: set time to noon UTC to prevent date shifting
      const weddingDate = new Date(newProject.date + 'T12:00:00.000Z');

      const created = await createTimeline({
        title: newProject.title,
        description: newProject.description,
        weddingDate: weddingDate.toISOString(),
      });

      // Ensure timeline was created with an ID
      if (!created?._id) {
        throw new Error('Failed to create timeline - no ID returned');
      }

      // Close modal and reset form only after successful creation
      setIsCreateModalOpen(false);
      setNewProject({ title: '', description: '', date: '' });
      
      toast.success('Project created successfully!');
      navigate(`/timeline/${created._id}`);
    } catch (error: any) {
      console.error('Error creating project:', error);
      showError(error.response?.data?.message || 'Failed to create project. Please try again.');
    }
  };

  // Status fields are not in backend model; omit status badge

  return (
    <div className="flex h-screen bg-background">
      <Toaster position="top-center" />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 max-w-7xl mx-auto w-full py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8 sm:mb-12 p-8 sm:p-10 bg-white rounded-2xl shadow-sm">
          <div>
            <h1 className="text-3xl sm:text-4xl font-heading text-text mb-2">{t('dashboard.title')}</h1>
            <p className="text-base sm:text-lg text-text opacity-70">{t('dashboard.welcome', { name: user?.name })}</p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            {user?.role === 'photographer' && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="inline-flex items-center gap-2 flex-1 sm:flex-none justify-center">
                <Plus size={18} />
                <span className="hidden xs:inline">{t('dashboard.newProject')}</span>
              </Button>
            )}
            <Button onClick={logout} variant="outline" className="inline-flex items-center gap-2 flex-1 sm:flex-none justify-center">
              <LogOut size={18} />
              <span className="hidden xs:inline">{t('auth.logout')}</span>
            </Button>
          </div>
        </div>

        {/* Pending Invitations Notification */}
        {pendingInvitations.length > 0 && (
          <div className="mb-6 sm:mb-10 p-6 sm:p-8 bg-white border border-accent border-opacity-30 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={18} className="text-blue-600" />
              <h3 className="text-lg sm:text-xl font-heading text-text">
                {t('dashboard.pendingInvitations', { count: pendingInvitations.length })}
              </h3>
            </div>
            <div className="space-y-2">
              {pendingInvitations.map((inv) => (
                <div key={inv.timelineId} className="p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-sm sm:text-base text-black">{inv.timelineTitle}</div>
                      <div className="text-xs sm:text-sm text-primary-600 mt-1">
                        {t('dashboard.invitedBy', { name: inv.invitedBy?.name })}
                        {inv.weddingDate && ` • ${new Date(inv.weddingDate).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div className="flex gap-2 sm:flex-shrink-0">
                      <Button onClick={() => handleAcceptInvitation(inv.timelineId)} size="sm" className="flex-1 sm:flex-none">{t('dashboard.accept')}</Button>
                      <Button onClick={() => handleDeclineInvitation(inv.timelineId)} size="sm" variant="outline" className="flex-1 sm:flex-none">{t('dashboard.decline')}</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Projects */}
        {user?.role === 'photographer' && ownedTimelines.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading text-text mb-6 sm:mb-8">{t('dashboard.myProjects')}</h2>
            {Object.entries(groupedOwnedTimelines).map(([monthKey, timelinesInMonth]) => (
              <div key={monthKey} className="mb-8">
                <h3 className="text-xl font-heading text-text opacity-60 mb-4 capitalize">
                  {getMonthLabel(monthKey)}
                </h3>
                <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {timelinesInMonth.map((timeline) => (
                <Card key={timeline._id} className="group relative">
                  <CardContent className="p-6">
                    <div className="cursor-pointer" onClick={() => navigate(`/timeline/${timeline._id}`)}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-heading text-text mb-3">{timeline.title || 'Untitled'}</h3>
                          <p className="text-base text-text opacity-75 leading-relaxed">{timeline.description || ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mb-3 text-sm text-primary-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-primary-600" />
                          <span>{timeline.weddingDate ? new Date(timeline.weddingDate).toLocaleDateString() : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-primary-600" />
                          <span>{t('dashboard.collaboratorsCount', { count: timeline.collaborators?.length || 0 })}</span>
                        </div>
                      </div>
                      {timeline.weddingDate && (
                        <div className="mb-4">
                          <CountdownTimer targetDate={timeline.weddingDate} compact />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenInviteModal(timeline._id, timeline.title);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <UserPlus size={16} />
                        {t('dashboard.inviteCollaborators')}
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeleteModal(timeline._id, timeline.title);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center justify-center gap-2 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                      >
                        <Trash2 size={16} />
                        {t('dashboard.deleteTimeline')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Shared Timelines */}
        {sharedTimelines.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <Share2 size={24} className="text-accent" />
              <h2 className="text-2xl sm:text-3xl font-heading text-text">{t('dashboard.sharedTimelines')}</h2>
            </div>
            {Object.entries(groupedSharedTimelines).map(([monthKey, timelinesInMonth]) => (
              <div key={monthKey} className="mb-8">
                <h3 className="text-xl font-heading text-text opacity-60 mb-4 capitalize">
                  {getMonthLabel(monthKey)}
                </h3>
                <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {timelinesInMonth.map((timeline) => (
                <Card key={timeline._id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/timeline/${timeline._id}`)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-black mb-2">{timeline.title || 'Untitled'}</h3>
                        <p className="text-sm text-primary-600 leading-6">{timeline.description || ''}</p>
                        <p className="text-xs text-primary-500 mt-2">
                          {t('dashboard.ownedBy', { name: timeline.owner?.name || t('common.unknown') })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mb-3 text-sm text-primary-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-primary-600" />
                        <span>{timeline.weddingDate ? new Date(timeline.weddingDate).toLocaleDateString() : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-primary-600" />
                        <span>{timeline.collaborators?.length || 0} collaborators</span>
                      </div>
                    </div>
                    {timeline.weddingDate && (
                      <div className="mb-3">
                        <CountdownTimer targetDate={timeline.weddingDate} compact />
                      </div>
                    )}
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-xs text-green-700">
                      {t('dashboard.sharedWithYou')}
                    </div>
                  </CardContent>
                </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {ownedTimelines.length === 0 && sharedTimelines.length === 0 && !isLoading && (
          <div className="text-center p-6 sm:p-12 bg-white border border-gray-200 rounded-xl shadow-sm">
            <Calendar size={48} className="sm:w-16 sm:h-16 text-primary-300 mx-auto mb-4 sm:mb-6" />
            <h3 className="text-xl sm:text-2xl font-semibold text-black mb-3">{t('dashboard.noProjects')}</h3>
            <p className="text-sm sm:text-base text-primary-600 mb-6 sm:mb-8 max-w-md mx-auto">
              {user?.role === 'photographer' 
                ? t('dashboard.photographerEmptyState')
                : t('dashboard.guestEmptyState')}
            </p>
            {user?.role === 'photographer' && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="text-sm sm:text-base font-medium inline-flex items-center gap-2">
                <Plus size={20} />
                {t('dashboard.createFirstProject')}
              </Button>
            )}
          </div>
        )}

        {/* Create Project Modal */}
        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-black mb-6">{t('dashboard.createNewProject')}</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">{t('dashboard.projectTitle')}</label>
                <Input
                  type="text"
                  placeholder={t('dashboard.projectTitlePlaceholder')}
                  value={newProject.title}
                  onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">{t('dashboard.description')}</label>
                <textarea
                  placeholder={t('dashboard.descriptionPlaceholder')}
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black min-h-[80px] resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">{t('dashboard.eventDate')}</label>
                <Input
  type="date"
  value={newProject.date}
  onChange={(e) => setNewProject(prev => ({ ...prev, date: e.target.value }))}
  required
  min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
  className="w-full" // Make it full width
/>
              </div>
              <div className="flex gap-3 mt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCreateModalOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" className="flex-1">
                  {t('dashboard.createProject')}
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Invite Modal */}
        {selectedTimelineForInvite && (
          <InviteModal
            isOpen={isInviteModalOpen}
            onClose={handleCloseInviteModal}
            timelineId={selectedTimelineForInvite.id}
            timelineTitle={selectedTimelineForInvite.title}
          />
        )}

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-black">{t('dashboard.deleteTimeline')}</h2>
                <p className="text-sm text-primary-600">{t('dashboard.deleteWarning')}</p>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-900 mb-2">
                {t('dashboard.deleteConfirmation')}
              </p>
              <p className="font-semibold text-red-900">
                "{selectedTimelineForDelete?.title}"
              </p>
              <p className="text-xs text-red-700 mt-2">
                {t('dashboard.deleteConsequence')}
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={handleCloseDeleteModal}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {t('dashboard.deletePermanently')}
              </Button>
            </div>
          </div>
        </Modal>
        </div>
      </div>
    </div>
  );
}
