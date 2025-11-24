import { Link } from 'react-router-dom';
import { Calendar, Users, Clock } from 'lucide-react';
import { Timeline } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { formatDate } from '@/lib/utils';

interface TimelineCardProps {
  timeline: Timeline;
}

export default function TimelineCard({ timeline }: TimelineCardProps) {
  const coupleNames = timeline.couple?.partner1 && timeline.couple?.partner2
    ? `${timeline.couple.partner1} & ${timeline.couple.partner2}`
    : timeline.title;

  return (
    <Link to={`/timeline/${timeline._id}`}>
      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
        <CardHeader>
          <CardTitle>{coupleNames}</CardTitle>
          {timeline.description && (
            <p className="text-base text-text opacity-80 mt-3 leading-relaxed">{timeline.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center text-base text-text opacity-75">
              <Calendar size={18} className="mr-3" />
              <span>{formatDate(timeline.weddingDate)}</span>
            </div>
            <div className="flex items-center text-base text-text opacity-75">
              <Clock size={18} className="mr-3" />
              <span>{timeline.events.length} events</span>
            </div>
            <div className="flex items-center text-base text-text opacity-75">
              <Users size={18} className="mr-3" />
              <span>{timeline.collaborators.length + 1} collaborators</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
