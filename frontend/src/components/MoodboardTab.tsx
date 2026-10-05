import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Pencil, Palette } from 'lucide-react';
import { Timeline } from '@/types';
import { useTimelineStore } from '@/store/timelineStore';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const MOODBOARD_HOST = 'moodboard.lenzu.app';

// Accepts a full deep-link (https://moodboard.lenzu.app/?board=board-xxx) or a
// raw board id (board-xxx) and returns a normalized URL, or null if invalid
function normalizeMoodboardUrl(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (/^board-[a-z0-9]+$/i.test(value)) {
    return `https://${MOODBOARD_HOST}/?board=${value}`;
  }
  try {
    const url = new URL(value);
    if (url.hostname !== MOODBOARD_HOST) return null;
    if (!url.searchParams.get('board')) return null;
    url.protocol = 'https:';
    return url.toString();
  } catch {
    return null;
  }
}

interface MoodboardTabProps {
  timeline: Timeline;
}

export default function MoodboardTab({ timeline }: MoodboardTabProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { updateTimeline } = useTimelineStore();
  const [editing, setEditing] = useState(false);
  const [urlInput, setUrlInput] = useState(timeline.moodboardUrl || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Master-only feature; TimelineView already filters the tab, this is a safety guard
  if (user?.role !== 'master') return null;

  const savedUrl = timeline.moodboardUrl || '';
  const showForm = editing || !savedUrl;

  const handleSave = async () => {
    const normalized = normalizeMoodboardUrl(urlInput);
    if (!normalized) {
      setError(t('timelineView.moodboardInvalidUrl'));
      return;
    }
    setError('');
    setSaving(true);
    try {
      await updateTimeline(timeline._id, { moodboardUrl: normalized });
      setUrlInput(normalized);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (showForm) {
    return (
      <div className="border-[1.5px] border-ink bg-paper p-6 sm:p-8 max-w-xl">
        <div className="flex items-center gap-2 mb-2">
          <Palette size={16} strokeWidth={1.5} className="text-ink" />
          <p className="alto-label text-ink">{t('timelineView.moodboardEmptyTitle')}</p>
        </div>
        <p className="font-mono text-[12px] text-stone leading-relaxed mb-4">
          {t('timelineView.moodboardEmptyDesc')}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 items-start">
          <Input
            mono
            value={urlInput}
            onChange={(e) => { setUrlInput(e.target.value); setError(''); }}
            placeholder={t('timelineView.moodboardPlaceholder')}
            error={error || undefined}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          />
          <div className="flex gap-2 shrink-0">
            <Button variant="accent" onClick={handleSave} disabled={saving} arrow>
              {t('timelineView.moodboardSave')}
            </Button>
            {savedUrl && (
              <Button variant="secondary" onClick={() => { setEditing(false); setUrlInput(savedUrl); setError(''); }}>
                {t('common.cancel')}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => { setUrlInput(savedUrl); setEditing(true); }}
          className="flex items-center gap-2"
        >
          <Pencil size={13} strokeWidth={1.5} />
          {t('timelineView.moodboardChangeLink')}
        </Button>
        <Button
          variant="secondary"
          onClick={() => window.open(savedUrl, '_blank', 'noopener')}
          className="flex items-center gap-2"
        >
          <ExternalLink size={13} strokeWidth={1.5} />
          {t('timelineView.moodboardOpenNew')}
        </Button>
      </div>
      <iframe
        src={savedUrl}
        title="Moodboard"
        className="w-full border-[1.5px] border-ink bg-white"
        style={{ height: 'calc(100vh - 280px)', minHeight: 480 }}
        allow="clipboard-write"
      />
    </div>
  );
}
