import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Users, LogOut, UserPlus, Share2, Bell, Trash2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import InviteModal from '@/components/InviteModal';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/authStore';
import { useTimelineStore } from '@/store/timelineStore';
import { useInvitationsStore } from '@/store/invitationsStore';

// Local helper interface for form only
interface NewProjectForm {
  title: string;
  description: string;
  date: string; // yyyy-mm-dd
}

export default function Dashboard() {
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

      const created = await createTimeline({
        title: newProject.title,
        description: newProject.description,
        weddingDate: new Date(newProject.date).toISOString(),
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
    <div className="flex h-screen bg-white">
      <Toaster position="top-center" />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto px-6 max-w-6xl mx-auto w-full py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-black mb-1">Dashboard</h1>
            <p className="text-primary-600">Welcome back, {user?.name}! Manage your wedding projects here.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setIsCreateModalOpen(true)} className="inline-flex items-center gap-2">
              <Plus size={20} />
              New Project
            </Button>
            <Button onClick={logout} variant="outline" className="inline-flex items-center gap-2">
              <LogOut size={20} />
              Logout
            </Button>
          </div>
        </div>

        {/* Pending Invitations Notification */}
        {pendingInvitations.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={20} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">
                {pendingInvitations.length} Pending Invitation{pendingInvitations.length > 1 ? 's' : ''}
              </h3>
            </div>
            <div className="space-y-2">
              {pendingInvitations.map((inv) => (
                <div key={inv.timelineId} className="p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-black">{inv.timelineTitle}</div>
                      <div className="text-sm text-primary-600 mt-1">
                        {inv.invitedBy?.name} invited you
                        {inv.weddingDate && ` • ${new Date(inv.weddingDate).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleAcceptInvitation(inv.timelineId)} size="sm">Accept</Button>
                      <Button onClick={() => handleDeclineInvitation(inv.timelineId)} size="sm" variant="outline">Decline</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Projects */}
        {user?.role === 'photographer' && ownedTimelines.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-black mb-4">My Projects</h2>
            <div className="grid gap-6" style={{gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))'}}>
              {ownedTimelines.map((timeline) => (
                <Card key={timeline._id} className="group relative">
                  <CardContent className="p-6">
                    <div className="cursor-pointer" onClick={() => navigate(`/timeline/${timeline._id}`)}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-black mb-2">{timeline.title || 'Untitled'}</h3>
                          <p className="text-sm text-primary-600 leading-6">{timeline.description || ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mb-4 text-sm text-primary-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-primary-600" />
                          <span>{timeline.weddingDate ? new Date(timeline.weddingDate).toLocaleDateString() : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-primary-600" />
                          <span>{timeline.collaborators?.length || 0} collaborators</span>
                        </div>
                      </div>
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
                        Invite Collaborators
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
                        Delete Timeline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Shared Timelines */}
        {sharedTimelines.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Share2 size={24} className="text-primary-600" />
              <h2 className="text-xl font-bold text-black">Shared Timelines</h2>
            </div>
            <div className="grid gap-6" style={{gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))'}}>
              {sharedTimelines.map((timeline) => (
                <Card key={timeline._id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/timeline/${timeline._id}`)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-black mb-2">{timeline.title || 'Untitled'}</h3>
                        <p className="text-sm text-primary-600 leading-6">{timeline.description || ''}</p>
                        <p className="text-xs text-primary-500 mt-2">
                          Owned by {timeline.owner?.name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mb-4 text-sm text-primary-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-primary-600" />
                        <span>{timeline.weddingDate ? new Date(timeline.weddingDate).toLocaleDateString() : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-primary-600" />
                        <span>{timeline.collaborators?.length || 0} collaborators</span>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-xs text-green-700">
                      Shared with you • Click to view →
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {ownedTimelines.length === 0 && sharedTimelines.length === 0 && !isLoading && (
          <div className="text-center p-12 bg-white border border-gray-200 rounded-xl shadow-sm">
            <Calendar size={64} className="text-primary-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-black mb-3">No projects yet</h3>
            <p className="text-primary-600 mb-8 max-w-md mx-auto">
              {user?.role === 'photographer' 
                ? "Start by creating your first wedding project. You can manage timelines, add events, and invite collaborators."
                : "You don't have any shared timelines yet. Ask a photographer to invite you to their project."}
            </p>
            {user?.role === 'photographer' && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="text-base font-medium inline-flex items-center gap-2">
                <Plus size={20} />
                Create Your First Project
              </Button>
            )}
          </div>
        )}

        {/* Create Project Modal */}
        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-black mb-6">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Project Title</label>
                <Input
                  type="text"
                  placeholder="e.g., Sarah & John's Wedding"
                  value={newProject.title}
                  onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Description</label>
                <textarea
                  placeholder="Brief description of the wedding project"
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black min-h-[80px] resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Wedding Date</label>
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
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Create Project
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
                <h2 className="text-xl font-semibold text-black">Delete Timeline</h2>
                <p className="text-sm text-primary-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-900 mb-2">
                You are about to permanently delete:
              </p>
              <p className="font-semibold text-red-900">
                "{selectedTimelineForDelete?.title}"
              </p>
              <p className="text-xs text-red-700 mt-2">
                All events, notes, and data associated with this timeline will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={handleCloseDeleteModal}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </Modal>
        </div>
      </div>
    </div>
  );
}
