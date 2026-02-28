import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, X, Upload, Image as ImageIcon, Save } from 'lucide-react';
import { Timeline, InspirationImage } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useTimelineStore } from '@/store/timelineStore';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'sonner';

interface InspirationProps {
  timeline: Timeline;
}

export default function Inspiration({ timeline }: InspirationProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { uploadInspiration, updateInspirationNotes, deleteInspiration } = useTimelineStore();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<InspirationImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = user && (
    timeline.owner._id === user._id ||
    timeline.collaborators.some(c => c.user && c.user._id === user._id)
  );

  const inspirationImages = timeline.inspiration || [];
  const imageCount = inspirationImages.length;

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(t('inspiration.invalidFile'));
        continue;
      }

      if (file.size > 15 * 1024 * 1024) {
        toast.error(t('inspiration.fileTooLarge'));
        continue;
      }

      try {
        await uploadInspiration(timeline._id, file);
        toast.success(t('inspiration.imageUploaded'));
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(t('inspiration.uploadFailed'));
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!window.confirm(t('inspiration.deleteConfirm'))) return;
    
    try {
      await deleteInspiration(timeline._id, imageId);
      toast.success(t('inspiration.imageDeleted'));
      if (selectedImage?._id === imageId) {
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('inspiration.deleteFailed'));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleStartEditNotes = (image: InspirationImage) => {
    setEditingNotes(image._id);
    setNotesValue(image.notes || '');
  };

  const handleSaveNotes = async (imageId: string) => {
    try {
      await updateInspirationNotes(timeline._id, imageId, notesValue);
      setEditingNotes(null);
      toast.success(t('inspiration.notesSaved'));
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error(t('inspiration.notesError'));
    }
  };

  const handleCancelEditNotes = () => {
    setEditingNotes(null);
    setNotesValue('');
  };

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || '';
    return `${baseUrl}${url}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('inspiration.title')}</h2>
          <p className="text-gray-600 mt-1">
            {t('inspiration.subtitle', { count: imageCount })}
          </p>
        </div>
        {canEdit && (
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            {t('inspiration.addImage')}
          </Button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* Image Grid or Empty State */}
      {imageCount === 0 ? (
        <Card>
          <CardContent 
            className={`py-12 text-center ${canEdit ? 'cursor-pointer' : ''} ${isDragging ? 'bg-gray-100 border-2 border-dashed border-gray-400' : ''}`}
            onDragOver={canEdit ? handleDragOver : undefined}
            onDragLeave={canEdit ? handleDragLeave : undefined}
            onDrop={canEdit ? handleDrop : undefined}
            onClick={canEdit ? () => fileInputRef.current?.click() : undefined}
          >
            <ImageIcon size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">{t('inspiration.noImages')}</p>
            {canEdit && (
              <>
                <p className="text-sm text-gray-500 mb-4">{t('inspiration.dragDropHint')}</p>
                <Button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  {t('inspiration.addFirstImage')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Drop Zone (when editing and has images) */}
          {canEdit && (
            <div
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                isDragging 
                  ? 'border-black bg-gray-100' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Upload size={20} />
                <span className="text-sm">{t('inspiration.dragDropHint')}</span>
              </div>
            </div>
          )}

          {/* Image Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {inspirationImages.map((image) => (
              <div key={image._id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <div
                  className="relative group aspect-square cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={getImageUrl(image.thumbnailUrl)}
                    alt={image.originalName || 'Inspiration'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  {canEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(image._id);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                
                {/* Notes Section */}
                <div className="p-3">
                  {editingNotes === image._id ? (
                    <div className="space-y-2">
                      <textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        placeholder={t('inspiration.notesPlaceholder')}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveNotes(image._id)}
                          className="flex-1 px-3 py-1.5 bg-black text-white text-xs rounded-lg hover:bg-gray-800 flex items-center justify-center gap-1"
                        >
                          <Save size={12} />
                          {t('common.save')}
                        </button>
                        <button
                          onClick={handleCancelEditNotes}
                          className="px-3 py-1.5 text-gray-600 text-xs rounded-lg hover:bg-gray-100"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canEdit) handleStartEditNotes(image);
                      }}
                      className={`text-sm ${canEdit ? 'cursor-text hover:bg-gray-50 rounded p-1 -m-1' : ''}`}
                    >
                      {image.notes ? (
                        <p className="text-gray-700">{image.notes}</p>
                      ) : (
                        canEdit && (
                          <p className="text-gray-400 italic">{t('inspiration.addNotes')}</p>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Uploading Indicator */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-gray-300 border-t-black rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">{t('inspiration.uploading')}</p>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 transition-colors z-10"
          >
            <X size={32} />
          </button>
          
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(selectedImage._id);
              }}
              className="absolute top-4 left-4 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors z-10 flex items-center gap-2"
            >
              <Trash2 size={20} />
              <span className="hidden sm:inline">{t('inspiration.deleteImage')}</span>
            </button>
          )}

          <img
            src={getImageUrl(selectedImage.imageUrl)}
            alt={selectedImage.originalName || 'Inspiration'}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
