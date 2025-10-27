import { useState } from 'react';
import { Users, Trash2 } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Timeline } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useTimelineStore } from '@/store/timelineStore';
import { toast } from 'sonner';

interface CollaboratorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeline: Timeline;
}

export default function CollaboratorsModal({ isOpen, onClose, timeline }: CollaboratorsModalProps) {
  const { user } = useAuthStore();
  const { removeCollaborator } = useTimelineStore();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isOwner = user && timeline.owner._id === user._id;

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
              {timeline.collaborators
                .filter(collab => collab.user) // Filter out null users
                .map((collab) => (
                  <div
                    key={collab.user._id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold">
                        {collab.user.name?.charAt(0).toUpperCase() || 'G'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{collab.user.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">{collab.user.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full capitalize">
                        {collab.role}
                      </span>
                      {isOwner && (
                        <button
                          onClick={() => handleRemoveCollaborator(collab.user._id, collab.user.name || 'User')}
                          disabled={removingId === collab.user._id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Remove collaborator"
                        >
                          {removingId === collab.user._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
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
