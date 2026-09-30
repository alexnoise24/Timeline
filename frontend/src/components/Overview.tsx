import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Edit2, Save, X, Camera, Plus, Trash2, Upload, Store, Instagram, FileText, Download, Sparkles } from 'lucide-react';
import { Timeline, Photographer } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useTimelineStore } from '@/store/timelineStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import ImageCropEditor from '@/components/ImageCropEditor';
import { toast } from 'sonner';

interface OverviewProps {
  timeline: Timeline;
}

export default function Overview({ timeline }: OverviewProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { updateOverview, fetchTimeline } = useTimelineStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isPhotographerModalOpen, setIsPhotographerModalOpen] = useState(false);
  const [editingPhotographer, setEditingPhotographer] = useState<Photographer | null>(null);
  const [photographerFormData, setPhotographerFormData] = useState({
    name: '',
    role: '',
    imageUrl: '',
  });
  const [tempImageForCrop, setTempImageForCrop] = useState<string | null>(null);
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
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

  const getInitialLocationsList = (tl: Timeline) => {
    if (tl.locationsList && tl.locationsList.length > 0) return tl.locationsList;
    if (tl.location) return [{ name: tl.location, url: tl.locationUrl || '' }];
    return [{ name: '', url: '' }];
  };

  const [locationsList, setLocationsList] = useState<Array<{ name: string; url: string }>>(
    getInitialLocationsList(timeline)
  );

  const [vendorsList, setVendorsList] = useState<Array<{ name: string; instagram: string; role: string }>>(
    timeline.vendorsList || []
  );

  // Accepts "@user", "user" or a pasted instagram.com URL → returns the bare handle
  const igHandle = (value: string) => {
    const trimmed = value.trim().replace(/^@/, '');
    const match = trimmed.match(/instagram\.com\/([A-Za-z0-9._]+)/);
    return match ? match[1] : trimmed;
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
    setLocationsList(getInitialLocationsList(timeline));
    setVendorsList(timeline.vendorsList || []);
  }, [timeline]);

  const canEdit = user && (
    timeline.owner._id === user._id ||
    timeline.collaborators.some(c => c.user && c.user._id === user._id && c.role === 'editor')
  );

  // Documents (planner PDFs)
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error(t('overview.onlyPdf'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('overview.documentTooLarge'));
      return;
    }
    setUploadingDocument(true);
    try {
      const token = localStorage.getItem('token');
      const body = new FormData();
      body.append('document', file, file.name);
      const response = await fetch(`/api/timelines/${timeline._id}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (!response.ok) throw new Error('Failed to upload document');
      await fetchTimeline(timeline._id);
      toast.success(t('overview.documentUploaded'));
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(t('overview.documentUploadError'));
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDocumentDownload = async (doc: { _id: string; name: string }) => {
    setDownloadingDocId(doc._id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/timelines/${timeline._id}/documents/${doc._id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to download document');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error(t('overview.documentDownloadError'));
    } finally {
      setDownloadingDocId(null);
    }
  };

  // Transcribe (master only) — planner PDF → timeline events via Claude API
  const isMasterUser = user?.role === 'master';
  const [transcribeDoc, setTranscribeDoc] = useState<{ _id: string; name: string } | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribedEvents, setTranscribedEvents] = useState<Array<{ time: string; title: string; description: string }> | null>(null);
  const [transcribeDayId, setTranscribeDayId] = useState('');
  const [insertingEvents, setInsertingEvents] = useState(false);

  const openTranscribeModal = (doc: { _id: string; name: string }) => {
    setTranscribeDoc(doc);
    setTranscribedEvents(null);
    setTranscribeDayId(timeline.days?.[0]?._id || '');
  };

  const closeTranscribeModal = () => {
    if (transcribing || insertingEvents) return;
    setTranscribeDoc(null);
    setTranscribedEvents(null);
  };

  const handleTranscribe = async () => {
    if (!transcribeDoc) return;
    setTranscribing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/timelines/${timeline._id}/documents/${transcribeDoc._id}/transcribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to transcribe document');
      const data = await response.json();
      setTranscribedEvents(data.events || []);
    } catch (error) {
      console.error('Error transcribing document:', error);
      toast.error(t('overview.transcribeError'));
    } finally {
      setTranscribing(false);
    }
  };

  const handleInsertEvents = async () => {
    if (!transcribedEvents || !transcribeDayId) return;
    const valid = transcribedEvents.filter((ev) => ev.title.trim());
    if (valid.length === 0) return;
    setInsertingEvents(true);
    try {
      const token = localStorage.getItem('token');
      for (const ev of valid) {
        const response = await fetch(`/api/timelines/${timeline._id}/days/${transcribeDayId}/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: ev.title.trim(),
            description: ev.description.trim(),
            time: ev.time.trim(),
            category: 'other',
          }),
        });
        if (!response.ok) throw new Error('Failed to insert event');
      }
      await fetchTimeline(timeline._id);
      toast.success(t('overview.transcribeInserted', { count: valid.length }));
      setTranscribeDoc(null);
      setTranscribedEvents(null);
    } catch (error) {
      console.error('Error inserting events:', error);
      toast.error(t('overview.transcribeInsertError'));
      await fetchTimeline(timeline._id);
    } finally {
      setInsertingEvents(false);
    }
  };

  const handleDocumentDelete = async (doc: { _id: string }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/timelines/${timeline._id}/documents/${doc._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete document');
      await fetchTimeline(timeline._id);
      toast.success(t('overview.documentDeleted'));
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(t('overview.documentDeleteError'));
    }
  };

  // Only owner can edit photographers team
  const canEditPhotographers = user && timeline.owner._id === user._id;

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
      
      const filteredLocations = locationsList.filter(l => l.name.trim() !== '');
      const firstLocation = filteredLocations[0];

      await updateOverview(timeline._id, {
        title: formData.title,
        description: formData.description,
        weddingDate: weddingDate.toISOString(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: firstLocation?.name || '',
        locationUrl: firstLocation?.url || '',
        locationsList: filteredLocations,
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
        vendorsList: vendorsList
          .map(v => ({ name: v.name.trim(), instagram: igHandle(v.instagram), role: v.role.trim() }))
          .filter(v => v.name !== '' || v.instagram !== ''),
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
    setLocationsList(getInitialLocationsList(timeline));
    setVendorsList(timeline.vendorsList || []);
    setIsEditing(false);
  };

  // Photographer functions
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('overview.invalidImage'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('overview.imageTooLarge'));
      return;
    }

    try {
      // Create temporary URL for cropping
      const reader = new FileReader();
      reader.onload = () => {
        setTempImageForCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error loading image:', error);
      toast.error(t('overview.errorProcessingImage'));
    }
  };

  const handleCropComplete = (blob: Blob) => {
    setCroppedImageBlob(blob);
    // Create preview URL
    const previewUrl = URL.createObjectURL(blob);
    setPhotographerFormData({ ...photographerFormData, imageUrl: previewUrl });
    setTempImageForCrop(null);
  };

  const handleCropCancel = () => {
    setTempImageForCrop(null);
  };

  const openImagePreview = (imageUrl: string, name: string) => {
    setPreviewImage({ url: imageUrl, name });
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  const openAddPhotographerModal = () => {
    setEditingPhotographer(null);
    setPhotographerFormData({ name: '', role: '', imageUrl: '' });
    setCroppedImageBlob(null);
    setIsPhotographerModalOpen(true);
  };

  const openEditPhotographerModal = (photographer: Photographer) => {
    setEditingPhotographer(photographer);
    setPhotographerFormData({
      name: photographer.name,
      role: photographer.role,
      imageUrl: photographer.imageUrl,
    });
    setCroppedImageBlob(null); // Clear so new image upload will trigger crop
    setIsPhotographerModalOpen(true);
  };

  const handleSavePhotographer = async () => {
    console.log('handleSavePhotographer called', photographerFormData);
    
    if (!photographerFormData.name || !photographerFormData.role) {
      console.log('Validation failed:', { 
        name: photographerFormData.name, 
        role: photographerFormData.role
      });
      toast.error(t('overview.allFieldsRequired'));
      return;
    }

    // Only require new image if adding (not editing)
    if (!editingPhotographer && !croppedImageBlob) {
      toast.error(t('overview.selectAndCropImage'));
      return;
    }

    // If editing and no new image, keep existing imageUrl
    if (editingPhotographer && !croppedImageBlob && !photographerFormData.imageUrl) {
      toast.error(t('overview.selectAndCropImage'));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      let imageUrl = photographerFormData.imageUrl;

      // Upload new image if we have a cropped blob
      if (croppedImageBlob) {
        const formData = new FormData();
        formData.append('photo', croppedImageBlob, 'photographer.jpg');

        console.log('Uploading image...');
        const uploadResponse = await fetch(`/api/timelines/${timeline._id}/photographers/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.imageUrl;
        console.log('Image uploaded:', imageUrl);
      }

      // Now save photographer with image URL
      const url = editingPhotographer
        ? `/api/timelines/${timeline._id}/photographers/${editingPhotographer._id}`
        : `/api/timelines/${timeline._id}/photographers`;
      
      const method = editingPhotographer ? 'PUT' : 'POST';

      console.log('Sending request to:', url, 'Method:', method);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: photographerFormData.name,
          role: photographerFormData.role,
          imageUrl: imageUrl,
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Response error:', errorData);
        throw new Error(errorData.message || 'Failed to save photographer');
      }

      toast.success(editingPhotographer ? t('overview.photographerUpdated') : t('overview.photographerAdded'));
      setIsPhotographerModalOpen(false);
      setCroppedImageBlob(null);
      // Refresh timeline data
      window.location.reload();
    } catch (error) {
      console.error('Error saving photographer:', error);
      toast.error(t('overview.errorSavingPhotographer') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeletePhotographer = async (photographerId: string) => {
    if (!window.confirm(t('overview.deletePhotographerConfirm'))) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/timelines/${timeline._id}/photographers/${photographerId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete photographer');

      toast.success(t('overview.photographerDeleted'));
      window.location.reload();
    } catch (error) {
      console.error('Error deleting photographer:', error);
      toast.error(t('overview.errorDeletingPhotographer'));
    }
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Locación</label>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setLocationsList([...locationsList, { name: '', url: '' }])}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Plus size={14} />
                    Agregar locación
                  </button>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-3">
                  {locationsList.map((loc, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Nombre de la locación"
                          value={loc.name}
                          onChange={(e) => {
                            const updated = [...locationsList];
                            updated[index] = { ...updated[index], name: e.target.value };
                            setLocationsList(updated);
                          }}
                        />
                        <Input
                          placeholder="Link de Google Maps (https://maps.google.com/...)"
                          value={loc.url}
                          onChange={(e) => {
                            const updated = [...locationsList];
                            updated[index] = { ...updated[index], url: e.target.value };
                            setLocationsList(updated);
                          }}
                        />
                      </div>
                      {locationsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setLocationsList(locationsList.filter((_, i) => i !== index))}
                          className="mt-1 p-1 text-red-500 hover:text-red-700 transition-colors"
                          title="Eliminar locación"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {(timeline.locationsList && timeline.locationsList.length > 0
                    ? timeline.locationsList
                    : timeline.location ? [{ name: timeline.location, url: timeline.locationUrl || '' }] : []
                  ).map((loc, index) => (
                    <div key={index}>
                      <p className="text-gray-900">{loc.name}</p>
                      {loc.url && (
                        <a
                          href={loc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline text-sm inline-block"
                        >
                          Ver en Google Maps
                        </a>
                      )}
                    </div>
                  ))}
                  {!timeline.location && !(timeline.locationsList?.length) && (
                    <p className="text-gray-900">-</p>
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

      {/* Vendors */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Store className="text-amber-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('overview.vendors')}</h3>
                <p className="text-sm text-gray-600">{t('overview.vendorsDesc')}</p>
              </div>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={() => setVendorsList([...vendorsList, { name: '', instagram: '', role: '' }])}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Plus size={14} />
                {t('overview.addVendor')}
              </button>
            )}
          </div>

          {isEditing ? (
            vendorsList.length > 0 ? (
              <div className="space-y-3">
                {vendorsList.map((vendor, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input
                        placeholder={t('overview.vendorName')}
                        value={vendor.name}
                        onChange={(e) => {
                          const updated = [...vendorsList];
                          updated[index] = { ...updated[index], name: e.target.value };
                          setVendorsList(updated);
                        }}
                      />
                      <Input
                        placeholder="@instagram"
                        value={vendor.instagram}
                        onChange={(e) => {
                          const updated = [...vendorsList];
                          updated[index] = { ...updated[index], instagram: e.target.value };
                          setVendorsList(updated);
                        }}
                      />
                      <Input
                        placeholder={t('overview.vendorRole')}
                        value={vendor.role}
                        onChange={(e) => {
                          const updated = [...vendorsList];
                          updated[index] = { ...updated[index], role: e.target.value };
                          setVendorsList(updated);
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setVendorsList(vendorsList.filter((_, i) => i !== index))}
                      className="mt-2 p-1 text-red-500 hover:text-red-700 transition-colors"
                      title={t('overview.removeVendor')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t('overview.noVendors')}</p>
            )
          ) : timeline.vendorsList && timeline.vendorsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {timeline.vendorsList.map((vendor, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-gray-900 truncate">{vendor.name || '-'}</h4>
                    {vendor.role && (
                      <span className="shrink-0 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        {vendor.role}
                      </span>
                    )}
                  </div>
                  {vendor.instagram && (
                    <a
                      href={`https://instagram.com/${igHandle(vendor.instagram)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Instagram size={13} />
                      @{igHandle(vendor.instagram)}
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t('overview.noVendors')}</p>
          )}
        </CardContent>
      </Card>

      {/* Documents (planner PDFs) */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                <FileText className="text-rose-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('overview.documents')}</h3>
                <p className="text-sm text-gray-600">{t('overview.documentsDesc')}</p>
              </div>
            </div>
            {canEdit && (
              <>
                <input
                  ref={documentInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={handleDocumentUpload}
                />
                <Button
                  onClick={() => documentInputRef.current?.click()}
                  variant="outline"
                  disabled={uploadingDocument}
                  className="flex items-center gap-2"
                >
                  <Upload size={16} />
                  {uploadingDocument ? t('overview.uploadingDocument') : t('overview.uploadDocument')}
                </Button>
              </>
            )}
          </div>

          {timeline.documentsList && timeline.documentsList.length > 0 ? (
            <div className="space-y-2">
              {timeline.documentsList.map((doc) => (
                <div key={doc._id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="text-gray-400 shrink-0" size={18} />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isMasterUser && timeline.days && timeline.days.length > 0 && (
                      <button
                        type="button"
                        onClick={() => openTranscribeModal(doc)}
                        className="p-2 text-purple-500 hover:text-purple-700 transition-colors"
                        title={t('overview.transcribe')}
                      >
                        <Sparkles size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDocumentDownload(doc)}
                      disabled={downloadingDocId === doc._id}
                      className="p-2 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
                      title={t('overview.downloadDocument')}
                    >
                      <Download size={16} />
                    </button>
                    {user && (timeline.owner._id === user._id || doc.uploadedBy === user._id) && (
                      <button
                        type="button"
                        onClick={() => handleDocumentDelete(doc)}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                        title={t('overview.deleteDocument')}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t('overview.noDocuments')}</p>
          )}
        </CardContent>
      </Card>

      {/* Transcribe modal (master only) */}
      <Modal
        isOpen={!!transcribeDoc}
        onClose={closeTranscribeModal}
        title={t('overview.transcribeTitle')}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 truncate">{transcribeDoc?.name}</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('overview.transcribeSelectDay')}
            </label>
            <select
              value={transcribeDayId}
              onChange={(e) => setTranscribeDayId(e.target.value)}
              disabled={transcribing || insertingEvents}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {timeline.days?.map((day) => (
                <option key={day._id} value={day._id}>
                  {day.label || new Date(day.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {transcribedEvents === null ? (
            <Button onClick={handleTranscribe} disabled={transcribing} className="w-full flex items-center justify-center gap-2">
              <Sparkles size={16} />
              {transcribing ? t('overview.transcribing') : t('overview.transcribeRun')}
            </Button>
          ) : transcribedEvents.length === 0 ? (
            <p className="text-sm text-gray-500">{t('overview.transcribeEmpty')}</p>
          ) : (
            <>
              <p className="text-xs text-gray-500">{t('overview.transcribePreviewHint')}</p>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {transcribedEvents.map((ev, index) => (
                  <div key={index} className="flex gap-2 items-start bg-gray-50 rounded-lg p-2">
                    <input
                      type="time"
                      value={ev.time}
                      onChange={(e) => {
                        const updated = [...transcribedEvents];
                        updated[index] = { ...updated[index], time: e.target.value };
                        setTranscribedEvents(updated);
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-24 shrink-0"
                    />
                    <div className="flex-1 space-y-1 min-w-0">
                      <input
                        type="text"
                        value={ev.title}
                        onChange={(e) => {
                          const updated = [...transcribedEvents];
                          updated[index] = { ...updated[index], title: e.target.value };
                          setTranscribedEvents(updated);
                        }}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm font-medium"
                      />
                      {ev.description !== '' && (
                        <textarea
                          value={ev.description}
                          rows={2}
                          onChange={(e) => {
                            const updated = [...transcribedEvents];
                            updated[index] = { ...updated[index], description: e.target.value };
                            setTranscribedEvents(updated);
                          }}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-600"
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setTranscribedEvents(transcribedEvents.filter((_, i) => i !== index))}
                      className="mt-1 p-1 text-red-500 hover:text-red-700 transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeTranscribeModal} disabled={insertingEvents} className="flex-1">
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleInsertEvents} disabled={insertingEvents || transcribedEvents.length === 0} className="flex-1">
                  {insertingEvents
                    ? t('overview.transcribeInserting')
                    : t('overview.transcribeInsert', { count: transcribedEvents.filter((ev) => ev.title.trim()).length })}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Photographers Team */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Camera className="text-purple-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('overview.photographersTeam')}</h3>
                <p className="text-sm text-gray-600">{t('overview.photographersTeamDesc')}</p>
              </div>
            </div>
            {canEditPhotographers && (
              <Button onClick={openAddPhotographerModal} variant="outline" className="flex items-center gap-2">
                <Plus size={16} />
                {t('overview.addPhotographer')}
              </Button>
            )}
          </div>

          {timeline.photographersTeam && timeline.photographersTeam.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timeline.photographersTeam
                .sort((a, b) => a.order - b.order)
                .map((photographer) => (
                  <div
                    key={photographer._id}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={photographer.imageUrl}
                        alt={photographer.name}
                        className="w-16 h-16 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openImagePreview(photographer.imageUrl, photographer.name)}
                        title="Click para ver en pantalla completa"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{photographer.name}</h4>
                        <p className="text-sm text-gray-600">{photographer.role}</p>
                      </div>
                      {canEditPhotographers && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditPhotographerModal(photographer)}
                            className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
                            title={t('common.edit')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeletePhotographer(photographer._id)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                            title={t('common.delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Camera className="mx-auto text-gray-400 mb-2" size={48} />
              <p className="text-gray-600 mb-4">{t('overview.noPhotographers')}</p>
              {canEditPhotographers && (
                <Button onClick={openAddPhotographerModal} variant="outline">
                  <Plus size={16} className="mr-2" />
                  {t('overview.addFirstPhotographer')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photographer Modal */}
      <Modal
        isOpen={isPhotographerModalOpen}
        onClose={() => setIsPhotographerModalOpen(false)}
        title={editingPhotographer ? t('overview.editPhotographer') : t('overview.addPhotographer')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('overview.photographerName')}</label>
            <Input
              placeholder={t('overview.photographerNamePlaceholder')}
              value={photographerFormData.name}
              onChange={(e) => setPhotographerFormData({ ...photographerFormData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('overview.photographerRole')}</label>
            <Input
              placeholder={t('overview.photographerRolePlaceholder')}
              value={photographerFormData.role}
              onChange={(e) => setPhotographerFormData({ ...photographerFormData, role: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('overview.photographerPhoto')}</label>
            {photographerFormData.imageUrl && (
              <div className="mb-3">
                <img
                  src={photographerFormData.imageUrl}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover mx-auto"
                />
              </div>
            )}
            <label className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
              <Upload size={20} className="text-gray-600" />
              <span className="text-sm text-gray-600">
                {photographerFormData.imageUrl ? t('overview.changePhoto') : t('overview.selectPhoto')}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">{t('overview.photoRequirements')}</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsPhotographerModalOpen(false)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSavePhotographer} className="flex-1">
              {editingPhotographer ? t('overview.update') : t('overview.add')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Crop Editor */}
      {tempImageForCrop && (
        <ImageCropEditor
          image={tempImageForCrop}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90 backdrop-blur-sm"
          onClick={closeImagePreview}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center">
            {/* Close button */}
            <button
              onClick={closeImagePreview}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
              title="Cerrar"
            >
              <X size={32} />
            </button>
            
            {/* Photographer name */}
            <div className="absolute top-4 left-4 text-white z-10">
              <h3 className="text-2xl font-semibold">{previewImage.name}</h3>
            </div>

            {/* Image */}
            <img
              src={previewImage.url}
              alt={previewImage.name}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
