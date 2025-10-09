import { create } from 'zustand';
import api from '@/lib/api';

export interface InvitationItem {
  timelineId: string;
  timelineTitle: string;
  weddingDate?: string;
  owner?: { _id: string; name: string; email: string };
  invitedBy?: { _id: string; name: string; email: string };
  status: 'pending' | 'accepted' | 'declined';
  invitedAt?: string;
}

interface InvitationsState {
  invitations: InvitationItem[];
  isLoading: boolean;
  error?: string;
  fetchMyInvitations: () => Promise<void>;
  inviteGuest: (timelineId: string, email: string, message?: string) => Promise<void>;
  acceptInvitation: (timelineId: string) => Promise<void>;
  declineInvitation: (timelineId: string) => Promise<void>;
  createInviteLink: (timelineId: string) => Promise<string>; // returns token
  acceptInviteToken: (token: string) => Promise<{ timelineId: string } | null>;
}

export const useInvitationsStore = create<InvitationsState>((set, get) => ({
  invitations: [],
  isLoading: false,

  fetchMyInvitations: async () => {
    set({ isLoading: true, error: undefined });
    try {
      const { data } = await api.get('/invitations/my-invitations');
      set({ invitations: data.invitations || [] });
    } catch (e: any) {
      set({ error: e.response?.data?.message || 'Failed to load invitations' });
    } finally {
      set({ isLoading: false });
    }
  },

  inviteGuest: async (timelineId, email, message) => {
    await api.post(`/invitations/invite/${timelineId}`, { email, message });
    // no state change needed here
  },

  createInviteLink: async (timelineId) => {
    const { data } = await api.post(`/invitations/create-link/${timelineId}`);
    return data.token as string;
  },

  acceptInviteToken: async (token) => {
    const { data } = await api.post(`/invitations/accept-invite-token`, { token });
    return data?.timelineId ? { timelineId: data.timelineId } : null;
  },

  acceptInvitation: async (timelineId) => {
    await api.post(`/invitations/accept-invitation/${timelineId}`);
    await get().fetchMyInvitations();
  },

  declineInvitation: async (timelineId) => {
    await api.post(`/invitations/decline-invitation/${timelineId}`);
    await get().fetchMyInvitations();
  }
}));
