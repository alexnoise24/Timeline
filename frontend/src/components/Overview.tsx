import { useState } from 'react';
import { Settings, Edit2, Save, X } from 'lucide-react';
import { Timeline } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useTimelineStore } from '@/store/timelineStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'sonner';

interface OverviewProps {
  timeline: Timeline;
}

export default function Overview({ timeline }: OverviewProps) {
  const { user } = useAuthStore();
  const { updateOverview } = useTimelineStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: timeline.title || '',
    description: timeline.description || '',
    weddingDate: timeline.weddingDate ? new Date(timeline.weddingDate).toISOString().split('T')[0] : '',
    startTime: timeline.startTime || '',
    endTime: timeline.endTime || '',
    partner1Phone: timeline.contacts?.partner1Phone || '',
    partner2Phone: timeline.contacts?.partner2Phone || '',
    plannerContact: timeline.contacts?.plannerContact || '',
    ceremonyLocation: timeline.locations?.ceremony || '',
    receptionLocation: timeline.locations?.reception || '',
    guestAttire: timeline.guestAttire || '',
    generalNotes: timeline.generalNotes || '',
  });

  const canEdit = user && (
    timeline.owner._id === user._id ||
    timeline.collaborators.some(c => c.user._id === user._id && c.role === 'editor')
  );

  const handleSave = async () => {
    try {
      await updateOverview(timeline._id, {
        title: formData.title,
        description: formData.description,
        weddingDate: new Date(formData.weddingDate).toISOString(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        contacts: {
          partner1Phone: formData.partner1Phone,
          partner2Phone: formData.partner2Phone,
          plannerContact: formData.plannerContact,
        },
        locations: {
          ceremony: formData.ceremonyLocation,
          reception: formData.receptionLocation,
        },
        guestAttire: formData.guestAttire,
        generalNotes: formData.generalNotes,
      });
      setIsEditing(false);
      toast.success('Overview updated successfully');
    } catch (error) {
      toast.error('Failed to update overview');
    }
  };

  const handleCancel = () => {
    setFormData({
      title: timeline.title || '',
      description: timeline.description || '',
      weddingDate: timeline.weddingDate ? new Date(timeline.weddingDate).toISOString().split('T')[0] : '',
      startTime: timeline.startTime || '',
      endTime: timeline.endTime || '',
      partner1Phone: timeline.contacts?.partner1Phone || '',
      partner2Phone: timeline.contacts?.partner2Phone || '',
      plannerContact: timeline.contacts?.plannerContact || '',
      ceremonyLocation: timeline.locations?.ceremony || '',
      receptionLocation: timeline.locations?.reception || '',
      guestAttire: timeline.guestAttire || '',
      generalNotes: timeline.generalNotes || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
          <p className="text-gray-600 mt-1">Essential project details</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" className="flex items-center gap-2">
                <Edit2 size={16} />
                Edit
              </Button>
            ) : (
              <>
                <Button onClick={handleCancel} variant="outline" className="flex items-center gap-2">
                  <X size={16} />
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex items-center gap-2">
                  <Save size={16} />
                  Save
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Basic Information */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Settings className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              <p className="text-sm text-gray-600">Essential project details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
              {isEditing ? (
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{timeline.title || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wedding Date</label>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.weddingDate}
                  onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{new Date(timeline.weddingDate).toLocaleDateString()}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              {isEditing ? (
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{timeline.startTime || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              {isEditing ? (
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{timeline.endTime || '-'}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              {isEditing ? (
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black min-h-[80px] resize-y"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{timeline.description || '-'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Information */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Settings className="text-green-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">General Information</h3>
              <p className="text-sm text-gray-600">Wedding party and contact details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {timeline.couple?.partner1 ? `${timeline.couple.partner1}'s Phone` : 'Partner 1 Phone'}
              </label>
              {isEditing ? (
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.partner1Phone}
                  onChange={(e) => setFormData({ ...formData, partner1Phone: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{timeline.contacts?.partner1Phone || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {timeline.couple?.partner2 ? `${timeline.couple.partner2}'s Phone` : 'Partner 2 Phone'}
              </label>
              {isEditing ? (
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.partner2Phone}
                  onChange={(e) => setFormData({ ...formData, partner2Phone: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{timeline.contacts?.partner2Phone || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ceremony Location</label>
              {isEditing ? (
                <Input
                  placeholder="Enter ceremony location"
                  value={formData.ceremonyLocation}
                  onChange={(e) => setFormData({ ...formData, ceremonyLocation: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{timeline.locations?.ceremony || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reception Location</label>
              {isEditing ? (
                <Input
                  placeholder="Enter reception location"
                  value={formData.receptionLocation}
                  onChange={(e) => setFormData({ ...formData, receptionLocation: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{timeline.locations?.reception || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Planner Contact</label>
              {isEditing ? (
                <Input
                  placeholder="Enter planner contact"
                  value={formData.plannerContact}
                  onChange={(e) => setFormData({ ...formData, plannerContact: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{timeline.contacts?.plannerContact || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guest Attire</label>
              {isEditing ? (
                <Input
                  placeholder="e.g., formal, casual"
                  value={formData.guestAttire}
                  onChange={(e) => setFormData({ ...formData, guestAttire: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{timeline.guestAttire || '-'}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">General Notes</label>
              {isEditing ? (
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black min-h-[120px] resize-y"
                  placeholder="Enter general notes"
                  value={formData.generalNotes}
                  onChange={(e) => setFormData({ ...formData, generalNotes: e.target.value })}
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{timeline.generalNotes || '-'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
