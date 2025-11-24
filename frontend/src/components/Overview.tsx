import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { updateOverview } = useTimelineStore();
  const [isEditing, setIsEditing] = useState(false);
  // Helper function to format date without timezone issues
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    console.log('Formatting date:', dateString, '→', formatted);
    return formatted;
  };

  const [formData, setFormData] = useState({
    title: timeline.title || '',
    description: timeline.description || '',
    weddingDate: formatDateForInput(timeline.weddingDate),
    startTime: timeline.startTime || '',
    endTime: timeline.endTime || '',
    partner1Phone: timeline.contacts?.partner1Phone || '',
    partner2Phone: timeline.contacts?.partner2Phone || '',
    plannerContact: timeline.contacts?.plannerContact || '',
    ceremonyLocation: timeline.locations?.ceremony || '',
    receptionLocation: timeline.locations?.reception || '',
    location: timeline.location || '',
    locationUrl: timeline.locationUrl || '',
    guestAttire: timeline.guestAttire || '',
    generalNotes: timeline.generalNotes || '',
  });

  // Update form data when timeline changes (e.g., after save)
  useEffect(() => {
    console.log('Timeline changed, updating form. Wedding date from server:', timeline.weddingDate);
    const formattedDate = formatDateForInput(timeline.weddingDate);
    console.log('Setting formData.weddingDate to:', formattedDate);
    
    setFormData({
      title: timeline.title || '',
      description: timeline.description || '',
      weddingDate: formattedDate,
      startTime: timeline.startTime || '',
      endTime: timeline.endTime || '',
      partner1Phone: timeline.contacts?.partner1Phone || '',
      partner2Phone: timeline.contacts?.partner2Phone || '',
      plannerContact: timeline.contacts?.plannerContact || '',
      ceremonyLocation: timeline.locations?.ceremony || '',
      receptionLocation: timeline.locations?.reception || '',
      location: timeline.location || '',
      locationUrl: timeline.locationUrl || '',
      guestAttire: timeline.guestAttire || '',
      generalNotes: timeline.generalNotes || '',
    });
  }, [timeline]);

  const canEdit = user && (
    timeline.owner._id === user._id ||
    timeline.collaborators.some(c => c.user && c.user._id === user._id && c.role === 'editor')
  );

  const handleSave = async () => {
    try {
      console.log('Saving date from form:', formData.weddingDate);
      
      if (!formData.weddingDate) {
        toast.error(t('overview.dateRequired'));
        return;
      }
      
      // Fix timezone issue: set time to noon UTC to prevent date shifting
      const weddingDate = new Date(formData.weddingDate + 'T12:00:00.000Z');
      
      console.log('Date to save (ISO):', weddingDate.toISOString());
      
      await updateOverview(timeline._id, {
        title: formData.title,
        description: formData.description,
        weddingDate: weddingDate.toISOString(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        locationUrl: formData.locationUrl,
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
      toast.success(t('overview.updateSuccess'));
    } catch (error) {
      console.error('Error saving overview:', error);
      toast.error(t('overview.updateFailed'));
    }
  };

  const handleCancel = () => {
    setFormData({
      title: timeline.title || '',
      description: timeline.description || '',
      weddingDate: formatDateForInput(timeline.weddingDate),
      startTime: timeline.startTime || '',
      endTime: timeline.endTime || '',
      partner1Phone: timeline.contacts?.partner1Phone || '',
      partner2Phone: timeline.contacts?.partner2Phone || '',
      plannerContact: timeline.contacts?.plannerContact || '',
      ceremonyLocation: timeline.locations?.ceremony || '',
      receptionLocation: timeline.locations?.reception || '',
      location: timeline.location || '',
      locationUrl: timeline.locationUrl || '',
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
          <h2 className="text-2xl font-bold text-gray-900">{t('timelineView.overview')}</h2>
          <p className="text-gray-600 mt-1">{t('overview.essentialDetails')}</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" className="flex items-center gap-2">
                <Edit2 size={16} />
                {t('common.edit')}
              </Button>
            ) : (
              <>
                <Button onClick={handleCancel} variant="outline" className="flex items-center gap-2">
                  <X size={16} />
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSave} className="flex items-center gap-2">
                  <Save size={16} />
                  {t('common.save')}
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
              <h3 className="text-lg font-semibold text-gray-900">{t('overview.basicInformation')}</h3>
              <p className="text-sm text-gray-600">{t('overview.essentialDetails')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('overview.projectTitle')}</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('overview.eventDate')}</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('overview.startTime')}</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('overview.endTime')}</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('overview.description')}</label>
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Locación</label>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Nombre de la locación"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                  <Input
                    placeholder="Link de Google Maps (https://maps.google.com/...)"
                    value={formData.locationUrl}
                    onChange={(e) => setFormData({ ...formData, locationUrl: e.target.value })}
                  />
                </div>
              ) : (
                <div>
                  <p className="text-gray-900">{timeline.location || '-'}</p>
                  {timeline.locationUrl && (
                    <a
                      href={timeline.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm mt-1 inline-block"
                    >
                      Ver en Google Maps
                    </a>
                  )}
                </div>
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
              <h3 className="text-lg font-semibold text-gray-900">{t('overview.generalInformation')}</h3>
              <p className="text-sm text-gray-600">{t('overview.contactDetails')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {timeline.couple?.partner1 ? `${timeline.couple.partner1}'s ${t('overview.phone')}` : t('overview.partner1Phone')}
              </label>
              {isEditing ? (
                <Input
                  type="tel"
                  placeholder={t('overview.enterPhone')}
                  value={formData.partner1Phone}
                  onChange={(e) => setFormData({ ...formData, partner1Phone: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{timeline.contacts?.partner1Phone || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {timeline.couple?.partner2 ? `${timeline.couple.partner2}'s ${t('overview.phone')}` : t('overview.partner2Phone')}
              </label>
              {isEditing ? (
                <Input
                  type="tel"
                  placeholder={t('overview.enterPhone')}
                  value={formData.partner2Phone}
                  onChange={(e) => setFormData({ ...formData, partner2Phone: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{timeline.contacts?.partner2Phone || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('overview.ceremonyLocation')}</label>
              {isEditing ? (
                <Input
                  placeholder={t('overview.enterCeremonyLocation')}
                  value={formData.ceremonyLocation}
                  onChange={(e) => setFormData({ ...formData, ceremonyLocation: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{timeline.locations?.ceremony || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('overview.receptionLocation')}</label>
              {isEditing ? (
                <Input
                  placeholder={t('overview.enterReceptionLocation')}
                  value={formData.receptionLocation}
                  onChange={(e) => setFormData({ ...formData, receptionLocation: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{timeline.locations?.reception || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('overview.plannerContact')}</label>
              {isEditing ? (
                <Input
                  placeholder={t('overview.enterPlannerContact')}
                  value={formData.plannerContact}
                  onChange={(e) => setFormData({ ...formData, plannerContact: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{timeline.contacts?.plannerContact || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('overview.guestAttire')}</label>
              {isEditing ? (
                <Input
                  placeholder={t('overview.guestAttirePlaceholder')}
                  value={formData.guestAttire}
                  onChange={(e) => setFormData({ ...formData, guestAttire: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{timeline.guestAttire || '-'}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('overview.generalNotes')}</label>
              {isEditing ? (
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black min-h-[120px] resize-y"
                  placeholder={t('overview.enterGeneralNotes')}
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
