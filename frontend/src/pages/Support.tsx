import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { FREE_FOR_ALL } from '@/lib/utils';
import { ArrowLeft, Mail, ChevronRight, Shield, FileText } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/authStore';

const FAQ_ES = [
  {
    q: '¿Cómo creo un nuevo proyecto?',
    a: 'Desde el Dashboard, haz clic en "Nuevo proyecto". Completa el nombre de la pareja, la fecha y el lugar.',
  },
  {
    q: '¿Cómo invito colaboradores?',
    a: 'Abre tu proyecto, ve a la pestaña Overview y usa el formulario de invitación. Puedes invitar por email o generar un link.',
  },
  {
    q: '¿Funciona con Apple Watch?',
    a: 'Sí. En el modo campo (Día de boda) la app sincroniza el timeline con tu Watch y envía notificaciones push para cada evento.',
  },
  {
    q: '¿Puedo cancelar mi suscripción?',
    a: 'Sí, en cualquier momento. Ve a Mi Plan → Gestionar suscripción. No se te cobra el siguiente mes.',
  },
  {
    q: '¿Qué pasa con mis datos si cancelo?',
    a: 'Tus proyectos se conservan 30 días después de cancelar. Puedes reactivar en cualquier momento.',
  },
];

const FAQ_EN = [
  {
    q: 'How do I create a new project?',
    a: 'From the Dashboard, click "New project". Fill in the couple name, date and venue.',
  },
  {
    q: 'How do I invite collaborators?',
    a: 'Open your project, go to the Overview tab and use the invite form. You can invite by email or share a link.',
  },
  {
    q: 'Does it work with Apple Watch?',
    a: 'Yes. In field mode (Wedding Day) the app syncs the timeline to your Watch and sends push notifications for each event.',
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Yes, anytime. Go to My Plan → Manage subscription. You won\'t be charged the next month.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'Your projects are kept for 30 days after cancelling. You can reactivate at any time.',
  },
];

export default function Support() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const isEs = i18n.language === 'es';
  const isNative = Capacitor.isNativePlatform();
  // While fully free (and always in native), drop any FAQ that mentions
  // plans/subscription/pricing.
  const faq = (isEs ? FAQ_ES : FAQ_EN).filter(
    (f) => !(FREE_FOR_ALL || isNative) || !/suscrip|subscription|mi plan|my plan|cancel/i.test(f.q + f.a)
  );

  const content = (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-8 pb-6 border-b-[1.5px] border-ink">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 alto-label text-stone hover:text-ink transition-colors duration-[80ms] mb-4"
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          {isEs ? 'Volver' : 'Back'}
        </button>
        <p className="alto-label text-stone mb-1">LENZU · AYUDA</p>
        <h1 className="font-display font-bold text-[32px] tracking-[-0.03em] leading-none text-ink">
          {isEs ? 'CENTRO DE AYUDA' : 'HELP CENTER'}
        </h1>
        <p className="font-mono text-[12px] text-stone mt-2">
          {isEs ? 'Estamos aquí para ayudarte.' : "We're here to help."}
        </p>
      </div>

      {/* Contact */}
      <div className="border-[1.5px] border-ink bg-paper mb-4">
        <div className="px-5 py-3 border-b-[1px] border-ink/20 flex items-center gap-2">
          <Mail size={12} strokeWidth={1.5} className="text-stone" />
          <h2 className="alto-label text-ink">{isEs ? 'CONTACTO' : 'CONTACT'}</h2>
        </div>
        <div className="px-5 py-5">
          <p className="font-mono text-[12px] text-stone leading-relaxed mb-4">
            {isEs
              ? '¿Tienes preguntas o necesitas ayuda? Escríbenos y te respondemos lo antes posible.'
              : 'Have questions or need help? Write to us and we\'ll get back to you as soon as possible.'}
          </p>
          <a
            href="mailto:support@lenzu.app"
            className="inline-flex items-center gap-2 border-[1.5px] border-ink px-4 py-[10px] font-mono font-bold text-[12px] text-ink hover:bg-fog transition-colors duration-[80ms]"
          >
            <Mail size={13} strokeWidth={1.5} />
            support@lenzu.app
          </a>
        </div>
      </div>

      {/* FAQ */}
      <div className="border-[1.5px] border-ink bg-paper mb-4">
        <div className="px-5 py-3 border-b-[1px] border-ink/20">
          <h2 className="alto-label text-ink">{isEs ? 'PREGUNTAS FRECUENTES' : 'FAQ'}</h2>
        </div>
        <div className="divide-y-[1px] divide-ink/10">
          {faq.map(({ q, a }) => (
            <div key={q} className="px-5 py-4">
              <p className="font-mono font-bold text-[12px] text-ink mb-1">{q}</p>
              <p className="font-mono text-[11px] text-stone leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="border-[1.5px] border-ink bg-paper mb-8">
        <div className="px-5 py-3 border-b-[1px] border-ink/20">
          <h2 className="alto-label text-ink">{isEs ? 'ENLACES ÚTILES' : 'USEFUL LINKS'}</h2>
        </div>
        <div className="divide-y-[1px] divide-ink/10">
          {[
            { label: isEs ? 'Política de privacidad' : 'Privacy Policy', path: '/privacy', icon: <Shield size={12} strokeWidth={1.5} /> },
            { label: isEs ? 'Términos de servicio' : 'Terms of Service', path: '/terms', icon: <FileText size={12} strokeWidth={1.5} /> },
            { label: isEs ? 'Ver planes' : 'View plans', path: '/pricing', icon: <ChevronRight size={12} strokeWidth={1.5} /> },
          ].filter((l) => !(FREE_FOR_ALL || isNative) || l.path !== '/pricing').map(({ label, path, icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-fog transition-colors duration-[80ms]"
            >
              <div className="flex items-center gap-2 font-mono text-[12px] text-ink">
                <span className="text-stone">{icon}</span>
                {label}
              </div>
              <ChevronRight size={12} strokeWidth={1.5} className="text-stone" />
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="alto-label text-stone text-center">Lenzu · © 2026 Alex Obregon</p>

    </div>
  );

  // Public route (no auth) — no Sidebar/Navbar
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-paper">
        {content}
      </div>
    );
  }

  return (
    <div className="flex h-full bg-paper">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 min-h-0 overflow-y-auto">
          {content}
        </div>
      </div>
    </div>
  );
}
