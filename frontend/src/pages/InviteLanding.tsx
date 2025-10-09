import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useInvitationsStore } from '@/store/invitationsStore';

export default function InviteLanding() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { acceptInviteToken } = useInvitationsStore();

  useEffect(() => {
    const handle = async () => {
      if (!token) {
        navigate('/');
        return;
      }
      // Guarda el token para usarlo tras autenticación
      localStorage.setItem('inviteToken', token);

      if (isAuthenticated) {
        try {
          const res = await acceptInviteToken(token);
          localStorage.removeItem('inviteToken');
          if (res?.timelineId) {
            navigate(`/timeline/${res.timelineId}`);
            return;
          }
        } catch (_) {}
        navigate('/');
      } else {
        // Redirige a registro por defecto (o login si ya tiene cuenta)
        navigate('/register');
      }
    };
    handle();
  }, [token, isAuthenticated, acceptInviteToken, navigate]);

  return null;
}
