import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail, MessageCircle, FileText, Shield, HelpCircle } from 'lucide-react';

export default function Support() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-text/70" />
          </button>
          <div>
            <h1 className="text-3xl font-heading text-text">
              {isSpanish ? 'Centro de Ayuda' : 'Help Center'}
            </h1>
            <p className="text-sm text-text/60">
              {isSpanish ? 'Estamos aquí para ayudarte' : "We're here to help"}
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent/20 rounded-lg">
              <Mail size={20} className="text-accent" />
            </div>
            <h2 className="text-xl font-semibold text-text">
              {isSpanish ? 'Contacto' : 'Contact Us'}
            </h2>
          </div>
          
          <p className="text-text/70 mb-4">
            {isSpanish 
              ? '¿Tienes preguntas o necesitas ayuda? Envíanos un correo y te responderemos lo antes posible.'
              : 'Have questions or need assistance? Send us an email and we\'ll get back to you as soon as possible.'}
          </p>
          
          <a 
            href="mailto:support@lenzu.app"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-text rounded-xl hover:bg-accent/80 transition-colors"
          >
            <Mail size={18} />
            support@lenzu.app
          </a>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HelpCircle size={20} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-text">
              {isSpanish ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="font-medium text-text mb-2">
                {isSpanish ? '¿Cómo creo un nuevo proyecto?' : 'How do I create a new project?'}
              </h3>
              <p className="text-text/70 text-sm">
                {isSpanish 
                  ? 'Desde el Dashboard, haz clic en el botón "Crear Nuevo" en la esquina superior derecha. Completa los detalles del evento y listo.'
                  : 'From the Dashboard, click the "Create New" button in the top right corner. Fill in the event details and you\'re all set.'}
              </p>
            </div>
            
            <div className="border-b border-gray-100 pb-4">
              <h3 className="font-medium text-text mb-2">
                {isSpanish ? '¿Cómo invito colaboradores?' : 'How do I invite collaborators?'}
              </h3>
              <p className="text-text/70 text-sm">
                {isSpanish 
                  ? 'Abre tu proyecto, ve a la pestaña "Overview" y haz clic en "Invitar". Ingresa el email del colaborador y selecciona su rol.'
                  : 'Open your project, go to the "Overview" tab and click "Invite". Enter the collaborator\'s email and select their role.'}
              </p>
            </div>
            
            <div className="border-b border-gray-100 pb-4">
              <h3 className="font-medium text-text mb-2">
                {isSpanish ? '¿Puedo usar la app sin conexión?' : 'Can I use the app offline?'}
              </h3>
              <p className="text-text/70 text-sm">
                {isSpanish 
                  ? 'Actualmente LenzuApp requiere conexión a internet para sincronizar cambios en tiempo real con tu equipo.'
                  : 'Currently LenzuApp requires an internet connection to sync changes in real-time with your team.'}
              </p>
            </div>
            
            <div className="pb-2">
              <h3 className="font-medium text-text mb-2">
                {isSpanish ? '¿Cómo cancelo mi suscripción?' : 'How do I cancel my subscription?'}
              </h3>
              <p className="text-text/70 text-sm">
                {isSpanish 
                  ? 'Ve a "Mi Plan" desde el menú y haz clic en "Gestionar Suscripción". Desde ahí puedes cancelar o modificar tu plan.'
                  : 'Go to "My Plan" from the menu and click "Manage Subscription". From there you can cancel or modify your plan.'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-text mb-4">
            {isSpanish ? 'Enlaces Útiles' : 'Useful Links'}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/privacy')}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left"
            >
              <Shield size={20} className="text-text/50" />
              <span className="text-text/80">
                {isSpanish ? 'Política de Privacidad' : 'Privacy Policy'}
              </span>
            </button>
            
            <button
              onClick={() => navigate('/terms')}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left"
            >
              <FileText size={20} className="text-text/50" />
              <span className="text-text/80">
                {isSpanish ? 'Términos de Servicio' : 'Terms of Service'}
              </span>
            </button>
            
            <button
              onClick={() => navigate('/pricing')}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left"
            >
              <MessageCircle size={20} className="text-text/50" />
              <span className="text-text/80">
                {isSpanish ? 'Ver Planes' : 'View Plans'}
              </span>
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center text-text/50 text-sm">
          <p>LenzuApp v1.0.0</p>
          <p>© 2026 Alex Obregon</p>
        </div>
      </div>
    </div>
  );
}
