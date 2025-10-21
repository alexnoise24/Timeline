import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useInvitationsStore } from '@/store/invitationsStore';
import { Loader2 } from 'lucide-react';

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { acceptInviteToken } = useInvitationsStore();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleInvite = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Invalid invite link');
        return;
      }

      // If user is not logged in, redirect to register with invite token
      if (!isAuthenticated || !user) {
        navigate(`/register?invite=${token}`);
        return;
      }

      // User is logged in, accept the invitation
      try {
        const result = await acceptInviteToken(token);
        if (result?.timelineId) {
          // Redirect to the timeline
          navigate(`/timeline/${result.timelineId}`, { replace: true });
        } else {
          setStatus('error');
          setErrorMessage('Failed to accept invitation');
        }
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error?.response?.data?.message || 'Invalid or expired invite link');
      }
    };

    handleInvite();
  }, [token, isAuthenticated, user, navigate, acceptInviteToken]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white border border-red-200 rounded-xl shadow-sm p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-black mb-2">Invite Error</h1>
            <p className="text-primary-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-primary-800 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center">
        <Loader2 size={48} className="text-primary-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-black mb-2">Processing Invitation...</h2>
        <p className="text-primary-600">Please wait while we set everything up.</p>
      </div>
    </div>
  );
}
