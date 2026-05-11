import Ticket from './Ticket';
import Wordmark from './Wordmark';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'paper' | 'ink' | 'mono';
  className?: string;
}

const sizeMap = {
  sm: { ticket: 32, wordmark: 18 },
  md: { ticket: 48, wordmark: 27 },
  lg: { ticket: 64, wordmark: 36 },
};

const variantMap = {
  paper: { ticketBg: '#7B7FE0', ticketFg: '#0A0A0A', wordColor: '#0A0A0A', dotColor: '#7B7FE0' },
  ink:   { ticketBg: '#F1EFEA', ticketFg: '#0A0A0A', wordColor: '#F1EFEA', dotColor: '#7B7FE0' },
  mono:  { ticketBg: '#0A0A0A', ticketFg: '#F1EFEA', wordColor: '#0A0A0A', dotColor: '#0A0A0A' },
};

export default function Logo({ size = 'md', variant = 'paper', className = '' }: LogoProps) {
  const { ticket: ticketSize, wordmark: wordmarkSize } = sizeMap[size];
  const { ticketBg, ticketFg, wordColor, dotColor } = variantMap[variant];
  const gap = wordmarkSize * 0.45;

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap,
      }}
    >
      <Ticket size={ticketSize} bg={ticketBg} fg={ticketFg} />
      <Wordmark size={wordmarkSize} color={wordColor} accentColor={dotColor} />
    </div>
  );
}
