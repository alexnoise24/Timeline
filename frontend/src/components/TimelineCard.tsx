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
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle>{coupleNames}</CardTitle>
          {timeline.description && (
            <p className="text-sm text-gray-600 mt-1">{timeline.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar size={16} className="mr-2" />
              <span>{formatDate(timeline.weddingDate)}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock size={16} className="mr-2" />
              <span>{timeline.events.length} events</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users size={16} className="mr-2" />
              <span>{timeline.collaborators.length + 1} collaborators</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
