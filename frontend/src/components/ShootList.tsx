import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Check, Camera, Edit2 } from 'lucide-react';
import { Timeline, Shot } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useTimelineStore } from '@/store/timelineStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'sonner';

interface ShootListProps {
  timeline: Timeline;
}

const SHOT_CATEGORIES = [
  { value: 'details', label: 'Details', color: 'bg-pink-100 text-pink-700', order: 1 },
  { value: 'preparation', label: 'Getting Ready', color: 'bg-purple-100 text-purple-700', order: 2 },
  { value: 'first_look', label: 'First Look', color: 'bg-rose-100 text-rose-700', order: 3 },
  { value: 'couple', label: 'Portraits', color: 'bg-blue-100 text-blue-700', order: 4 },
  { value: 'family', label: 'Family Portraits', color: 'bg-orange-100 text-orange-700', order: 5 },
  { value: 'ceremony', label: 'Ceremony', color: 'bg-red-100 text-red-700', order: 6 },
  { value: 'cocktail', label: 'Cocktail', color: 'bg-green-100 text-green-700', order: 7 },
  { value: 'reception', label: 'Reception', color: 'bg-yellow-100 text-yellow-700', order: 8 },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700', order: 9 },
];

export default function ShootList({ timeline }: ShootListProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { addShot, updateShot, deleteShot } = useTimelineStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingShot, setEditingShot] = useState<Shot | null>(null);
  const [newShot, setNewShot] = useState({
    title: '',
    category: 'other' as Shot['category'],
    description: '',
  });

  const canEdit = user && (
    timeline.owner._id === user._id ||
    timeline.collaborators.some(c => c.user && c.user._id === user._id)
  );

  const handleAddShot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addShot(timeline._id, newShot);
      setIsAddModalOpen(false);
      setNewShot({ title: '', category: 'other', description: '' });
      toast.success(t('shotList.shotAdded'));
    } catch (error) {
      toast.error(t('shotList.shotAddFailed'));
    }
  };

  const handleToggleComplete = async (shot: Shot) => {
    try {
      await updateShot(timeline._id, shot._id, { isCompleted: !shot.isCompleted });
      toast.success(shot.isCompleted ? t('shotList.shotIncomplete') : t('shotList.shotCompleted'));
    } catch (error) {
      toast.error(t('shotList.shotUpdateFailed'));
    }
  };

  const handleDeleteShot = async (shotId: string) => {
    if (!window.confirm(t('shotList.deleteShotConfirm'))) return;
    try {
      await deleteShot(timeline._id, shotId);
      toast.success(t('shotList.shotDeleted'));
    } catch (error) {
      toast.error(t('shotList.shotDeleteFailed'));
    }
  };

  const handleEditShot = (shot: Shot) => {
    setEditingShot(shot);
    setNewShot({
      title: shot.title,
      category: shot.category,
      description: shot.description || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateShot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShot) return;
    
    try {
      await updateShot(timeline._id, editingShot._id, {
        title: newShot.title,
        category: newShot.category,
        description: newShot.description,
      });
      setIsEditModalOpen(false);
      setEditingShot(null);
      setNewShot({ title: '', category: 'other', description: '' });
      toast.success(t('shotList.shotUpdated'));
    } catch (error) {
      toast.error(t('shotList.shotUpdateFailed'));
    }
  };

  const shotList = timeline.shotList || [];
  const filteredShots = selectedCategory === 'all'
    ? shotList
    : shotList.filter(shot => shot.category === selectedCategory);

  const completedCount = shotList.filter(s => s.isCompleted).length;
  const totalCount = shotList.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Group shots by category and sort by order
  const shotsByCategory = SHOT_CATEGORIES.sort((a, b) => a.order - b.order).map(cat => ({
    ...cat,
    shots: filteredShots.filter(s => s.category === cat.value),
    count: shotList.filter(s => s.category === cat.value).length,
  })).filter(cat => selectedCategory === 'all' || cat.value === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('shotList.title')}</h2>
          <p className="text-gray-600 mt-1">
            {t('shotList.shotsCompleted', { completed: completedCount, total: totalCount, percentage: completionPercentage })}
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <Plus size={20} />
            {t('shotList.addShot')}
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-green-600 h-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('shotList.all', { count: totalCount })}
        </button>
        {SHOT_CATEGORIES.sort((a, b) => a.order - b.order).map(cat => {
          const count = shotList.filter(s => s.category === cat.value).length;
          if (count === 0) return null;
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat.value
                  ? cat.color
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Shot List */}
      {filteredShots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Camera size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {selectedCategory === 'all'
                ? t('shotList.noShots')
                : t('shotList.noCategoryShots', { category: t(`shotList.category${SHOT_CATEGORIES.find(c => c.value === selectedCategory)?.label.replace(/\s/g, '')}`) })}
            </p>
            {canEdit && selectedCategory === 'all' && (
              <Button onClick={() => setIsAddModalOpen(true)}>{t('shotList.addFirstShot')}</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {shotsByCategory.map(category => {
            if (category.shots.length === 0) return null;
            return (
              <div key={category.value}>
                {selectedCategory === 'all' && (
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg text-sm ${category.color}`}>
                      {category.label}
                    </span>
                    <span className="text-gray-600 text-sm">
                      {category.shots.filter(s => s.isCompleted).length}/{category.shots.length}
                    </span>
                  </h3>
                )}
                <div className="space-y-2">
                  {category.shots.map(shot => (
                    <Card
                      key={shot._id}
                      className={`transition-all ${shot.isCompleted ? 'opacity-60' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <button
                              onClick={() => handleToggleComplete(shot)}
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                shot.isCompleted
                                  ? 'bg-green-600 border-green-600'
                                  : 'border-gray-300 hover:border-green-600'
                              }`}
                            >
                              {shot.isCompleted && <Check size={16} className="text-white" />}
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`font-medium ${
                                shot.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}
                            >
                              {shot.title}
                            </h4>
                            {shot.description && (
                              <p className="text-sm text-gray-600 mt-1">{shot.description}</p>
                            )}
                            {shot.isCompleted && shot.completedBy && (
                              <p className="text-xs text-gray-500 mt-2">
                                {t('shotList.completedBy', { name: shot.completedBy.name })}
                              </p>
                            )}
                          </div>
                          {canEdit && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditShot(shot)}
                                className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteShot(shot._id)}
                                className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Shot Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t('shotList.addShot')}>
        <form onSubmit={handleAddShot} className="space-y-4">
          <Input
            label={t('shotList.shotTitle')}
            placeholder={t('shotList.shotTitlePlaceholder')}
            value={newShot.title}
            onChange={(e) => setNewShot({ ...newShot, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('shotList.category')}</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              value={newShot.category}
              onChange={(e) => setNewShot({ ...newShot, category: e.target.value as Shot['category'] })}
            >
              {SHOT_CATEGORIES.sort((a, b) => a.order - b.order).map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('shotList.description')}
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black min-h-[80px] resize-y"
              placeholder={t('shotList.descriptionPlaceholder')}
              value={newShot.description}
              onChange={(e) => setNewShot({ ...newShot, description: e.target.value })}
            />
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1">
              {t('shotList.addShot')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Shot Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t('shotList.editShot')}>
        <form onSubmit={handleUpdateShot} className="space-y-4">
          <Input
            label={t('shotList.shotTitle')}
            placeholder={t('shotList.shotTitlePlaceholder')}
            value={newShot.title}
            onChange={(e) => setNewShot({ ...newShot, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('shotList.category')}</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              value={newShot.category}
              onChange={(e) => setNewShot({ ...newShot, category: e.target.value as Shot['category'] })}
            >
              {SHOT_CATEGORIES.sort((a, b) => a.order - b.order).map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('shotList.description')}
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black min-h-[80px] resize-y"
              placeholder={t('shotList.descriptionPlaceholder')}
              value={newShot.description}
              onChange={(e) => setNewShot({ ...newShot, description: e.target.value })}
            />
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingShot(null);
                setNewShot({ title: '', category: 'other', description: '' });
              }}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1">
              {t('shotList.updateShot')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
