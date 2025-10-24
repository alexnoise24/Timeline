export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'photographer' | 'guest';
  avatar?: string;
  invitedTimelines?: Array<{
    timelineId: string;
    invitedBy: string;
    invitedAt: string;
    status: 'pending' | 'accepted' | 'declined';
  }>;
  createdAt: string;
}

export interface Note {
  _id: string;
  content: string;
  author: User;
  createdAt: string;
}

export interface ChangeLog {
  _id: string;
  action: 'created' | 'updated' | 'deleted' | 'note_added';
  field?: string;
  oldValue?: any;
  newValue?: any;
  user: User;
  timestamp: string;
  description?: string;
}

export interface Shot {
  _id: string;
  title: string;
  category: 'preparation' | 'details' | 'ceremony' | 'first_look' | 'family' | 'couple' | 'reception' | 'venue' | 'other';
  description?: string;
  isCompleted: boolean;
  completedBy?: User;
  completedAt?: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  _id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  category: 'ceremony' | 'reception' | 'preparation' | 'photography' | 'other';
  notes: Note[];
  changeLogs: ChangeLog[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Collaborator {
  user: User;
  role: 'editor' | 'viewer';
  addedAt: string;
}

export interface Timeline {
  _id: string;
  title: string;
  weddingDate: string;
  location?: string;
  couple?: {
    partner1?: string;
    partner2?: string;
  };
  description?: string;
  // Overview/General Information fields
  startTime?: string;
  endTime?: string;
  contacts?: {
    partner1Phone?: string;
    partner2Phone?: string;
    plannerContact?: string;
  };
  locations?: {
    ceremony?: string;
    reception?: string;
  };
  guestAttire?: string;
  generalNotes?: string;
  owner: User;
  collaborators: Collaborator[];
  events: Event[];
  shotList: Shot[];
  changeLogs: ChangeLog[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}
