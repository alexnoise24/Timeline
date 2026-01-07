import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronLeft, Calendar, Users, Clock, CheckCircle, Eye } from 'lucide-react';
import Button from '@/components/ui/Button';

interface OnboardingProps {
  userRole: 'creator' | 'guest';
  onComplete: () => void;
}

interface OnboardingSlide {
  title: string;
  subtitle?: string;
  text?: string;
  microText?: string;
  bullets?: string[];
  cta?: string;
  icon: React.ReactNode;
}

const creatorSlides: OnboardingSlide[] = [
  {
    title: 'Bienvenido a Lenzu',
    subtitle: 'Diseña y organiza días de boda con claridad y control.',
    microText: 'Timelines claros para días que fluyen mejor.',
    icon: <Calendar size={64} className="text-accent" />
  },
  {
    title: 'Tú marcas el ritmo',
    text: 'Como creador, puedes construir timelines, definir momentos clave y guiar a todos los involucrados.',
    microText: 'Pensado para fotógrafos, planners y equipos creativos.',
    icon: <Clock size={64} className="text-accent" />
  },
  {
    title: 'Crea timelines reales',
    text: 'Organiza el día con estructura flexible, diseñada para adaptarse a cambios y decisiones de último momento.',
    bullets: ['Crea y edita timelines', 'Ajusta horarios fácilmente', 'Mantén todo bajo control'],
    icon: <CheckCircle size={64} className="text-accent" />
  },
  {
    title: 'Invita y colabora',
    text: 'Comparte timelines con parejas y colaboradores para que todos estén alineados.',
    microText: 'Menos mensajes. Más claridad.',
    icon: <Users size={64} className="text-accent" />
  },
  {
    title: 'Empieza a construir',
    text: 'Tu próximo evento merece orden y calma.',
    cta: 'Crear mi primer timeline',
    icon: <Calendar size={64} className="text-accent" />
  }
];

const guestSlides: OnboardingSlide[] = [
  {
    title: 'Bienvenido a Lenzu',
    subtitle: 'Todo el día de la boda, en un solo lugar.',
    microText: 'Claro, simple y compartido contigo.',
    icon: <Calendar size={64} className="text-accent" />
  },
  {
    title: 'Aquí para acompañar',
    text: 'Has sido invitado a un timeline para seguir y colaborar en la organización del día.',
    microText: 'Nada que instalar. Nada complicado.',
    icon: <Users size={64} className="text-accent" />
  },
  {
    title: 'Participa con claridad',
    text: 'Consulta horarios, revisa momentos importantes y realiza ajustes cuando el creador lo permita.',
    bullets: ['Ver el timeline completo', 'Editar secciones asignadas', 'Mantenerte al día'],
    icon: <Eye size={64} className="text-accent" />
  },
  {
    title: 'Todo alineado',
    text: 'Los cambios se reflejan en tiempo real para que todos trabajen sobre la misma versión.',
    microText: 'Una sola fuente de verdad.',
    icon: <CheckCircle size={64} className="text-accent" />
  },
  {
    title: 'Sigue el flujo',
    text: 'Disfruta el proceso sin confusión.',
    cta: 'Ver el timeline',
    icon: <Calendar size={64} className="text-accent" />
  }
];

export default function Onboarding({ userRole, onComplete }: OnboardingProps) {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = userRole === 'creator' ? creatorSlides : guestSlides;
  const isLastSlide = currentSlide === slides.length - 1;
  const isFirstSlide = currentSlide === 0;

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstSlide) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <button
          onClick={handleSkip}
          className="text-text/50 hover:text-text text-sm font-medium transition-colors"
        >
          {t('common.skip', 'Omitir')}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Icon */}
        <div className="mb-8 p-6 bg-accent/10 rounded-full">
          {slide.icon}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text mb-4">
          {slide.title}
        </h1>

        {/* Subtitle */}
        {slide.subtitle && (
          <p className="text-lg text-text/80 mb-2 max-w-md">
            {slide.subtitle}
          </p>
        )}

        {/* Text */}
        {slide.text && (
          <p className="text-base text-text/70 mb-4 max-w-md leading-relaxed">
            {slide.text}
          </p>
        )}

        {/* Bullets */}
        {slide.bullets && (
          <ul className="text-left mb-4 space-y-2">
            {slide.bullets.map((bullet, index) => (
              <li key={index} className="flex items-center gap-2 text-text/70">
                <CheckCircle size={16} className="text-accent flex-shrink-0" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Micro text */}
        {slide.microText && (
          <p className="text-sm text-text/50 mt-2 max-w-sm">
            {slide.microText}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="p-6 pb-8">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-accent w-6'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {!isFirstSlide && (
            <button
              onClick={handlePrev}
              className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={24} className="text-text" />
            </button>
          )}
          
          <Button
            onClick={handleNext}
            className="flex-1 py-3 text-base font-medium"
          >
            {isLastSlide ? (slide.cta || t('common.start', 'Comenzar')) : t('common.next', 'Siguiente')}
            {!isLastSlide && <ChevronRight size={20} className="ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
