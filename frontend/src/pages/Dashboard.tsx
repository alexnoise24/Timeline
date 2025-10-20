import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Users, LogOut } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
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
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { timelines, createTimeline, fetchTimelines, isLoading } = useTimelineStore();
  const { invitations, fetchMyInvitations, acceptInvitation, declineInvitation, isLoading: loadingInvites } = useInvitationsStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProject, setNewProject] = useState<NewProjectForm>({
    title: '',
    description: '',
    date: ''
  });

  useEffect(() => {
    if (user) {
      fetchTimelines();
      if (user.role === 'guest') {
        fetchMyInvitations();
      }
    }
  }, [user, fetchTimelines, fetchMyInvitations]);

  const handleCreateProject = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user) return;
  setError(''); // Reset error state

  try {
    const created = await createTimeline({
      title: newProject.title,
      description: newProject.description,
      weddingDate: new Date(newProject.date).toISOString(), // Convert to ISO string
    });

    setIsCreateModalOpen(false);
    setNewProject({ title: '', description: '', date: '' });
    if (created?._id) {
      navigate(`/timeline/${created._id}`);
    }
  } catch (error: any) {
    console.error('Error creating project:', error);
    setError(error.response?.data?.message || 'Failed to create project. Please try again.');
  }
};

  // Status fields are not in backend model; omit status badge

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="px-6 max-w-6xl mx-auto">
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

        {/* Guest Invitations */}
        {user?.role === 'guest' && (
          <div className="mb-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-semibold text-black mb-3">Your Invitations</h3>
              {loadingInvites ? (
                <div className="text-primary-600">Loading invitations...</div>
              ) : invitations.length === 0 ? (
                <div className="text-primary-600">No invitations yet.</div>
              ) : (
                <div className="grid gap-3" style={{gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))'}}>
                  {invitations.map((inv) => {
                    const clickable = inv.status === 'accepted';
                    return (
                      <div
                        key={inv.timelineId}
                        className={`border border-gray-200 rounded-lg p-3 ${clickable ? 'cursor-pointer hover:bg-primary-50' : 'opacity-70'}`}
                        onClick={() => clickable && navigate(`/timeline/${inv.timelineId}`)}
                        role={clickable ? 'button' : undefined}
                        aria-disabled={!clickable}
                      >
                        <div className="font-semibold text-black">{inv.timelineTitle}</div>
                        <div className="text-xs text-primary-600 mt-1">
                          {inv.weddingDate ? new Date(inv.weddingDate).toLocaleDateString() : ''}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {inv.status === 'pending' ? (
                            <>
                              <Button onClick={() => acceptInvitation(inv.timelineId)} size="sm">Accept</Button>
                              <Button onClick={() => declineInvitation(inv.timelineId)} size="sm" variant="outline">Decline</Button>
                            </>
                          ) : (
                            <span className="text-xs text-primary-600">Status: {inv.status}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Projects Grid */}
        <div className="grid gap-6" style={{gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))'}}>
          {timelines.filter(Boolean).map((timeline) => (
            <Card key={timeline!._id} className="cursor-pointer" onClick={() => navigate(`/timeline/${timeline!._id}`)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-2">{timeline!.title || 'Untitled'}</h3>
                    <p className="text-sm text-primary-600 leading-6">{timeline!.description || ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-4 text-sm text-primary-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-primary-600" />
                    <span>{timeline!.weddingDate ? new Date(timeline!.weddingDate).toLocaleDateString() : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-primary-600" />
                    <span>{timeline!.collaborators?.length || 0} collaborators</span>
                  </div>
                </div>
                <div className="p-3 bg-primary-50 rounded-lg border border-gray-200 text-xs text-primary-600">
                  Click to manage this project →
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {timelines.length === 0 && !isLoading && (
          <div className="text-center p-12 bg-white border border-gray-200 rounded-xl shadow-sm">
            <Calendar size={64} className="text-primary-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-black mb-3">No projects yet</h3>
            <p className="text-primary-600 mb-8 max-w-md mx-auto">
              Start by creating your first wedding project. You can manage timelines, add events, and invite collaborators.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)} className="text-base font-medium inline-flex items-center gap-2">
              <Plus size={20} />
              Create Your First Project
            </Button>
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
      </div>
    </div>
  );
}
