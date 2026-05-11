import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. Aceptación de términos',
    body: 'Al acceder o utilizar Lenzu ("el Servicio"), aceptas estar sujeto a estos Términos de Servicio. Si no estás de acuerdo con estos términos, no utilices el Servicio.',
  },
  {
    title: '2. Descripción del servicio',
    body: 'Lenzu es una plataforma de gestión de timelines para fotógrafos de bodas y sus colaboradores. El Servicio permite crear, gestionar y compartir timelines de eventos, subir imágenes y colaborar con el equipo.',
  },
  {
    title: '3. Cuentas de usuario',
    intro: 'Al crear una cuenta, aceptas:',
    list: [
      'Proporcionar información precisa y completa.',
      'Mantener la seguridad de tu contraseña.',
      'Aceptar la responsabilidad de todas las actividades bajo tu cuenta.',
      'Notificarnos inmediatamente ante cualquier uso no autorizado.',
    ],
  },
  {
    title: '4. Planes y pagos',
    intro: 'Ofrecemos dos planes:',
    list: [
      'Prueba gratuita: 30 días con acceso a todas las funciones. Sin tarjeta de crédito.',
      'Pro: $5 USD/mes con acceso completo a todas las funciones. Cancela cuando quieras.',
    ],
    footer: 'Las suscripciones se facturan mensualmente y se renuevan automáticamente. Puedes cancelar en cualquier momento desde la configuración de tu cuenta.',
  },
  {
    title: '5. Contenido del usuario',
    intro: 'Conservas la propiedad del contenido que subes. Al subir contenido, nos otorgas una licencia para:',
    list: [
      'Almacenar y mostrar tu contenido dentro del Servicio.',
      'Compartir el contenido con los colaboradores que invites.',
      'Crear copias de seguridad para la protección de datos.',
    ],
    footer: 'Eres responsable de asegurarte de tener los derechos para subir cualquier contenido.',
  },
  {
    title: '6. Usos prohibidos',
    intro: 'Aceptas no:',
    list: [
      'Utilizar el Servicio para fines ilegales.',
      'Subir código malicioso o contenido dañino.',
      'Intentar obtener acceso no autorizado a nuestros sistemas.',
      'Interferir en el uso del Servicio por parte de otros usuarios.',
      'Revender o redistribuir el Servicio sin permiso.',
      'Subir contenido que infrinja los derechos de otros.',
    ],
  },
  {
    title: '7. Propiedad intelectual',
    body: 'El Servicio, incluyendo su diseño, características y contenido (excluyendo el contenido subido por usuarios), es propiedad de Lenzu y está protegido por las leyes de propiedad intelectual. No puedes copiar, modificar ni distribuir ninguna parte del Servicio sin nuestro permiso por escrito.',
  },
  {
    title: '8. Limitación de responsabilidad',
    body: 'El Servicio se proporciona "tal cual" sin garantías de ningún tipo. No somos responsables de daños indirectos, incidentales, especiales o consecuentes derivados del uso del Servicio. Nuestra responsabilidad total no superará el importe que nos hayas pagado en los últimos 12 meses.',
  },
  {
    title: '9. Rescisión',
    body: 'Podemos suspender o cancelar tu cuenta si infringes estos Términos. Puedes cancelar tu cuenta en cualquier momento. Tras la cancelación, tu derecho a usar el Servicio cesa de inmediato, aunque podamos conservar ciertos datos según lo exija la ley.',
  },
  {
    title: '10. Cambios en los términos',
    body: 'Podemos modificar estos Términos en cualquier momento. Te notificaremos los cambios significativos por email o a través del Servicio. El uso continuado tras los cambios implica la aceptación de los nuevos Términos.',
  },
  {
    title: '11. Ley aplicable',
    body: 'Estos Términos se rigen por las leyes aplicables. Cualquier disputa se resolverá en los tribunales competentes de la jurisdicción correspondiente.',
  },
  {
    title: '12. Contacto',
    body: 'Para preguntas sobre estos Términos, contáctanos en: support@lenzu.app',
  },
];

export default function TermsOfService() {
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
            TÉRMINOS DE SERVICIO
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
                <p className="font-mono text-[11px] text-stone leading-relaxed mt-2">{footer}</p>
              )}
            </div>
          ))}
        </div>

        <p className="alto-label text-stone text-center">Lenzu · © 2026 Alex Obregon</p>
      </div>
    </div>
  );
}
