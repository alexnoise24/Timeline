import { useState, useEffect } from 'react';
import { Users, Trash2, X, Clock } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Timeline } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useTimelineStore } from '@/store/timelineStore';
import { toast } from 'sonner';
import api from '@/lib/api';

interface CollaboratorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeline: Timeline;
}

interface PendingInvitation {
  userId: string;
  userName: string;
  userEmail: string;
  invitedAt: string;
  status: string;
}

export default function CollaboratorsModal({ isOpen, onClose, timeline }: CollaboratorsModalProps) {
  const { user } = useAuthStore();
  const { removeCollaborator } = useTimelineStore();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);

  const isOwner = user && timeline.owner._id === user._id;

  useEffect(() => {
    if (isOpen && isOwner) {
      fetchPendingInvitations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isOwner, timeline._id]);

  const fetchPendingInvitations = async () => {
    setIsLoadingInvitations(true);
    try {
      const { data } = await api.get(`/invitations/timeline/${timeline._id}/pending`);
      setPendingInvitations(data.invitations || []);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from this timeline?`)) {
      return;
    }

    setRemovingId(userId);
    try {
      await removeCollaborator(timeline._id, userId);
      toast.success('Collaborator removed successfully');
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast.error('Failed to remove collaborator');
    } finally {
      setRemovingId(null);
    }
  };

  const handleRevokeInvitation = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to revoke the invitation for ${userName}?`)) {
      return;
    }

    setRevokingId(userId);
    try {
      await api.delete(`/invitations/timeline/${timeline._id}/revoke/${userId}`);
      toast.success('Invitation revoked successfully');
      // Refresh pending invitations list
      await fetchPendingInvitations();
    } catch (error) {
      console.error('Error revoking invitation:', error);
      toast.error('Failed to revoke invitation');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Collaborators">
      <div className="space-y-4">
        {/* Owner */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Owner</h3>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                {timeline.owner.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{timeline.owner.name}</p>
                <p className="text-sm text-gray-600">{timeline.owner.email}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
              Owner
            </span>
          </div>
        </div>

        {/* Collaborators */}
        {timeline.collaborators.length > 0 ? (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Collaborators ({timeline.collaborators.length})
            </h3>
            <div className="space-y-2">
              {timeline.collaborators.map((collab, index) => {
                const userId = collab.user?._id || (typeof collab.user === 'string' ? collab.user : null);
                const userName = collab.user?.name || 'Unknown User';
                const userEmail = collab.user?.email || 'No email available';
                const userInitial = userName.charAt(0).toUpperCase();
                
                return (
                  <div
                    key={userId?.toString() || `collab-${index}`}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold">
                        {userInitial}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{userName}</p>
                        <p className="text-sm text-gray-600">{userEmail}</p>
                        {!collab.user?.name && (
                          <p className="text-xs text-orange-600 mt-1">⚠️ User data not loaded</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full capitalize">
                        {collab.role}
                      </span>
                      {isOwner && userId && (
                        <button
                          onClick={() => handleRemoveCollaborator(userId.toString(), userName)}
                          disabled={removingId === userId?.toString()}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Remove collaborator"
                        >
                          {removingId === userId?.toString() ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Users size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No collaborators yet</p>
            {isOwner && (
              <p className="text-sm text-gray-500 mt-1">Invite guests using the form above</p>
            )}
          </div>
        )}

        {/* Pending Invitations */}
        {isOwner && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Pending Invitations ({pendingInvitations.length})
            </h3>
            {isLoadingInvitations ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto" />
              </div>
            ) : pendingInvitations.length > 0 ? (
              <div className="space-y-2">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.userId}
                    className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-semibold">
                        <Clock size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{invitation.userName}</p>
                        <p className="text-sm text-gray-600">{invitation.userEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                        Pending
                      </span>
                      <button
                        onClick={() => handleRevokeInvitation(invitation.userId, invitation.userName)}
                        disabled={revokingId === invitation.userId}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Revoke invitation"
                      >
                        {revokingId === invitation.userId ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <X size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">No pending invitations</p>
              </div>
            )}
          </div>
        )}

        {/* Close button */}
        <div className="pt-4 border-t">
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
