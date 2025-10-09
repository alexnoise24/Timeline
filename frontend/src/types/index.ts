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
  owner: User;
  collaborators: Collaborator[];
  events: Event[];
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
