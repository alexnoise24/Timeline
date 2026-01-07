export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'master' | 'creator' | 'photographer' | 'planner' | 'guest';
  avatar?: string;
  invitedTimelines?: Array<{
    timelineId: string;
    invitedBy: string;
    invitedAt: string;
    status: 'pending' | 'accepted' | 'declined';
  }>;
  // Trial and Plan fields
  trial_start_date?: string;
  trial_end_date?: string;
  is_trial_active?: boolean;
  current_plan?: 'none' | 'trial' | 'free' | 'starter' | 'pro' | 'studio' | 'master';
  plan_expiration_date?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  branding?: {
    enabled: boolean;
    studioName?: string;
    logo?: string;
    accentColor?: string;
    subdomain?: string;
    emailFooter?: string;
  };
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
  category: 'preparation' | 'details' | 'ceremony' | 'first_look' | 'family' | 'couple' | 'cocktail' | 'reception' | 'venue' | 'other';
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
  isCompleted: boolean;
  completedBy?: User;
  completedAt?: string;
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

export interface Day {
  _id: string;
  date: string;
  label?: string;
  events: Event[];
  order: number;
  createdAt: string;
}

export interface Photographer {
  _id: string;
  name: string;
  role: string;
  imageUrl: string;
  order: number;
  createdAt: string;
}

export interface Timeline {
  _id: string;
  title: string;
  weddingDate: string;
  location?: string;
  locationUrl?: string;
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
  days: Day[];  // Multi-day support
  events: Event[];  // Deprecated - kept for backward compatibility
  shotList: Shot[];
  photographersTeam: Photographer[];
  changeLogs: ChangeLog[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  timelineId: string;
  sender: User;
  content: string;
  createdAt: string;
  readBy: Array<{
    user: User | string;
    readAt: string;
  }>;
}

export interface Conversation {
  timeline: {
    _id: string;
    title: string;
    couple?: {
      partner1?: string;
      partner2?: string;
    };
    weddingDate: string;
    owner: User;
  };
  lastMessage?: Message;
  unreadCount: number;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}
