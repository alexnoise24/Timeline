import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. Introducción',
    body: 'Bienvenido a Lenzu ("nosotros", "nuestro"). Nos comprometemos a proteger tu privacidad y garantizar la seguridad de tu información personal. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y protegemos tu información cuando utilizas nuestra aplicación móvil y servicio web.',
  },
  {
    title: '2. Información que recopilamos',
    intro: 'Recopilamos información que nos proporcionas directamente:',
    list: [
      'Información de cuenta: nombre, email y contraseña al crear una cuenta.',
      'Información de perfil: rol profesional (fotógrafo, planificador o invitado).',
      'Datos de eventos: timelines, detalles de eventos, fechas, lugares y notas.',
      'Multimedia: fotos subidas para perfiles de fotógrafo.',
      'Comunicaciones: mensajes compartidos dentro de los timelines.',
      'Información de pago: datos de facturación procesados de forma segura a través de Stripe (no almacenamos números de tarjeta).',
    ],
  },
  {
    title: '3. Cómo usamos tu información',
    intro: 'Usamos la información recopilada para:',
    list: [
      'Proveer, mantener y mejorar nuestros servicios.',
      'Procesar transacciones y gestionar suscripciones.',
      'Enviarte notificaciones sobre tus eventos y colaboraciones.',
      'Responder a tus comentarios, preguntas y solicitudes de soporte.',
      'Enviarte avisos técnicos y alertas de seguridad.',
      'Cumplir con obligaciones legales.',
    ],
  },
  {
    title: '4. Compartir información',
    intro: 'Podemos compartir tu información en las siguientes situaciones:',
    list: [
      'Con colaboradores: la información del timeline se comparte con los usuarios que invites.',
      'Proveedores de servicio: utilizamos terceros (Stripe para pagos, servicios de email) que procesan datos en nuestro nombre.',
      'Requisitos legales: cuando la ley lo exija o para proteger nuestros derechos.',
    ],
    footer: 'No vendemos tu información personal a terceros.',
  },
  {
    title: '5. Almacenamiento y seguridad',
    body: 'Tus datos se almacenan en servidores seguros. Implementamos medidas técnicas y organizativas adecuadas para proteger tu información personal contra acceso no autorizado, alteración, divulgación o destrucción. Toda la transmisión de datos está cifrada mediante protocolos SSL/TLS.',
  },
  {
    title: '6. Tus derechos',
    intro: 'Tienes derecho a:',
    list: [
      'Acceder a la información personal que guardamos sobre ti.',
      'Solicitar la corrección de datos inexactos.',
      'Solicitar la eliminación de tu cuenta y datos asociados.',
      'Exportar tus datos en un formato portable.',
      'Cancelar las comunicaciones de marketing.',
    ],
  },
  {
    title: '7. Retención de datos',
    body: 'Conservamos tu información personal mientras tu cuenta esté activa o sea necesaria para prestarte servicios. Puedes solicitar la eliminación de tu cuenta en cualquier momento contactándonos. Tras eliminar la cuenta, podemos conservar cierta información según lo exija la ley.',
  },
  {
    title: '8. Privacidad de menores',
    body: 'Nuestro servicio no está destinado a menores de 13 años. No recopilamos conscientemente información personal de menores de 13 años. Si eres padre o tutor y crees que tu hijo nos ha proporcionado información, contáctanos.',
  },
  {
    title: '9. Cambios en esta política',
    body: 'Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos cualquier cambio publicando la nueva política en esta página y actualizando la fecha de "Última actualización".',
  },
  {
    title: '10. Contacto',
    body: 'Si tienes preguntas sobre esta Política de Privacidad o nuestras prácticas de datos, contáctanos en: support@lenzu.app',
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8 pb-6 border-b-[1.5px] border-ink">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 alto-label text-stone hover:text-ink transition-colors duration-[80ms] mb-4"
          >
            <ArrowLeft size={13} strokeWidth={1.5} />
            Volver
          </button>
          <p className="alto-label text-stone mb-1">LENZU · LEGAL</p>
          <h1 className="font-display font-bold text-[32px] tracking-[-0.03em] leading-none text-ink">
            POLÍTICA DE PRIVACIDAD
          </h1>
          <p className="font-mono text-[11px] text-stone mt-2">Última actualización: 28 de enero de 2026</p>
        </div>

        {/* Sections */}
        <div className="space-y-0 border-[1.5px] border-ink divide-y-[1px] divide-ink/15 mb-8">
          {SECTIONS.map(({ title, body, intro, list, footer }) => (
            <div key={title} className="px-5 py-5">
              <h2 className="font-mono font-bold text-[12px] text-ink mb-2 uppercase tracking-[0.02em]">{title}</h2>
              {intro && (
                <p className="font-mono text-[11px] text-stone leading-relaxed mb-2">{intro}</p>
              )}
              {list && (
                <ul className="space-y-1 mb-2 border-l-[2px] border-ink/20 pl-3">
                  {list.map((item, i) => (
                    <li key={i} className="font-mono text-[11px] text-stone leading-relaxed">{item}</li>
                  ))}
                </ul>
              )}
              {body && (
                <p className="font-mono text-[11px] text-stone leading-relaxed">{body}</p>
              )}
              {footer && (
                <p className="font-mono text-[11px] text-ink font-bold mt-2">{footer}</p>
              )}
            </div>
          ))}
        </div>

        <p className="alto-label text-stone text-center">Lenzu · © 2026 Alex Obregon</p>
      </div>
    </div>
  );
}
