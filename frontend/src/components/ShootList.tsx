import { useState } from 'react';
import { Plus, Trash2, Check, Camera } from 'lucide-react';
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
  { value: 'preparation', label: 'Preparation', color: 'bg-purple-100 text-purple-700' },
  { value: 'details', label: 'Details', color: 'bg-pink-100 text-pink-700' },
  { value: 'ceremony', label: 'Ceremony', color: 'bg-red-100 text-red-700' },
  { value: 'first_look', label: 'First Look', color: 'bg-rose-100 text-rose-700' },
  { value: 'family', label: 'Family', color: 'bg-orange-100 text-orange-700' },
  { value: 'couple', label: 'Couple', color: 'bg-blue-100 text-blue-700' },
  { value: 'reception', label: 'Reception', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'venue', label: 'Venue', color: 'bg-green-100 text-green-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' },
];

export default function ShootList({ timeline }: ShootListProps) {
  const { user } = useAuthStore();
  const { addShot, updateShot, deleteShot } = useTimelineStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
      toast.success('Shot added successfully');
    } catch (error) {
      toast.error('Failed to add shot');
    }
  };

  const handleToggleComplete = async (shot: Shot) => {
    try {
      await updateShot(timeline._id, shot._id, { isCompleted: !shot.isCompleted });
      toast.success(shot.isCompleted ? 'Shot marked as incomplete' : 'Shot completed!');
    } catch (error) {
      toast.error('Failed to update shot');
    }
  };

  const handleDeleteShot = async (shotId: string) => {
    if (!window.confirm('Are you sure you want to delete this shot?')) return;
    try {
      await deleteShot(timeline._id, shotId);
      toast.success('Shot deleted successfully');
    } catch (error) {
      toast.error('Failed to delete shot');
    }
  };

  const shotList = timeline.shotList || [];
  const filteredShots = selectedCategory === 'all'
    ? shotList
    : shotList.filter(shot => shot.category === selectedCategory);

  const completedCount = shotList.filter(s => s.isCompleted).length;
  const totalCount = shotList.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Group shots by category
  const shotsByCategory = SHOT_CATEGORIES.map(cat => ({
    ...cat,
    shots: filteredShots.filter(s => s.category === cat.value),
    count: shotList.filter(s => s.category === cat.value).length,
  })).filter(cat => selectedCategory === 'all' || cat.value === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shot Lists</h2>
          <p className="text-gray-600 mt-1">
            {completedCount} of {totalCount} shots completed ({completionPercentage}%)
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <Plus size={20} />
            Add Shot
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
          All ({totalCount})
        </button>
        {SHOT_CATEGORIES.map(cat => {
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
                ? 'No shots added yet. Start by adding your first shot!'
                : `No shots in the ${SHOT_CATEGORIES.find(c => c.value === selectedCategory)?.label} category`}
            </p>
            {canEdit && selectedCategory === 'all' && (
              <Button onClick={() => setIsAddModalOpen(true)}>Add First Shot</Button>
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
                                Completed by {shot.completedBy.name}
                              </p>
                            )}
                          </div>
                          {canEdit && (
                            <button
                              onClick={() => handleDeleteShot(shot._id)}
                              className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
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
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Shot">
        <form onSubmit={handleAddShot} className="space-y-4">
          <Input
            label="Shot Title"
            placeholder="e.g., Ring close-up, First dance"
            value={newShot.title}
            onChange={(e) => setNewShot({ ...newShot, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              value={newShot.category}
              onChange={(e) => setNewShot({ ...newShot, category: e.target.value as Shot['category'] })}
            >
              {SHOT_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black min-h-[80px] resize-y"
              placeholder="Add any notes or details about this shot..."
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
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Shot
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
