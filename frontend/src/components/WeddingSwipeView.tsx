import { useState, useRef, TouchEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Camera, Sparkles } from 'lucide-react';
import { Timeline } from '@/types';

interface WeddingSwipeViewProps {
  timeline: Timeline;
  timelineContent: React.ReactNode;
  shotListContent: React.ReactNode;
  inspirationContent: React.ReactNode;
  activeEventId: string | null;
}

type SwipeTab = 'timeline' | 'shotlist' | 'inspiration';

export default function WeddingSwipeView({
  timeline,
  timelineContent,
  shotListContent,
  inspirationContent,
  activeEventId,
}: WeddingSwipeViewProps) {
  const { t } = useTranslation();
  const [activePanel, setActivePanel] = useState<SwipeTab>('timeline');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance to trigger panel change
  const minSwipeDistance = 50;

  const panels: SwipeTab[] = ['timeline', 'shotlist', 'inspiration'];
  const currentIndex = panels.indexOf(activePanel);

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < panels.length - 1) {
      setActivePanel(panels[currentIndex + 1]);
    }
    if (isRightSwipe && currentIndex > 0) {
      setActivePanel(panels[currentIndex - 1]);
    }
  };

  const getPanelIcon = (panel: SwipeTab) => {
    switch (panel) {
      case 'timeline':
        return <Calendar size={20} />;
      case 'shotlist':
        return <Camera size={20} />;
      case 'inspiration':
        return <Sparkles size={20} />;
    }
  };

  const getPanelLabel = (panel: SwipeTab) => {
    switch (panel) {
      case 'timeline':
        return t('timelineView.timeline', 'Timeline');
      case 'shotlist':
        return t('timelineView.shotList', 'Shot List');
      case 'inspiration':
        return t('timelineView.inspiration', 'Inspiration');
    }
  };

  return (
    <div className="fixed inset-0 bg-field-bg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 pt-[env(safe-area-inset-top)] px-4 pb-3 bg-field-surface border-b border-field-accent/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-field-text truncate max-w-[200px]">
              {timeline.couple?.partner1 && timeline.couple?.partner2
                ? `${timeline.couple.partner1} & ${timeline.couple.partner2}`
                : timeline.title}
            </h1>
            {activeEventId && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 text-xs font-semibold rounded-full bg-field-highlight text-field-bg animate-pulse">
                <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                {t('timelineView.now', 'AHORA')}
              </span>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-field-accent uppercase tracking-wider">
              {getPanelLabel(activePanel)}
            </div>
          </div>
        </div>
      </div>

      {/* Swipeable Content Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {/* Timeline Panel */}
          <div className="w-full h-full flex-shrink-0 overflow-y-auto px-4 py-4">
            {timelineContent}
          </div>

          {/* Shot List Panel */}
          <div className="w-full h-full flex-shrink-0 overflow-y-auto px-4 py-4">
            {shotListContent}
          </div>

          {/* Inspiration Panel */}
          <div className="w-full h-full flex-shrink-0 overflow-y-auto px-4 py-4">
            {inspirationContent}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Dots */}
      <div className="flex-shrink-0 pb-[env(safe-area-inset-bottom)] bg-field-surface border-t border-field-accent/20">
        <div className="flex items-center justify-center gap-6 py-4">
          {panels.map((panel) => (
            <button
              key={panel}
              onClick={() => setActivePanel(panel)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                activePanel === panel
                  ? 'text-field-highlight bg-field-highlight/10'
                  : 'text-field-accent hover:text-field-text'
              }`}
            >
              {getPanelIcon(panel)}
              <span className="text-[10px] font-medium uppercase tracking-wider">
                {getPanelLabel(panel)}
              </span>
              {activePanel === panel && (
                <div className="w-1.5 h-1.5 rounded-full bg-field-highlight mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
