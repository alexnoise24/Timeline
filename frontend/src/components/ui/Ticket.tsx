interface TicketProps {
  size?: number;
  content?: string;
  rotate?: number;
  shadow?: boolean;
  bg?: string;
  fg?: string;
  className?: string;
}

export default function Ticket({
  size = 56,
  content = 'L',
  rotate = -6,
  shadow = true,
  bg = '#7B7FE0',
  fg = '#0A0A0A',
  className = '',
}: TicketProps) {
  const padV = size * 0.10;
  const padH = size * 0.22;
  const fontSize = size * 0.7;
  const shadowVal = shadow
    ? `0 ${size * 0.06}px ${size * 0.14}px rgba(10,10,10,0.18)`
    : 'none';

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: bg,
        padding: `${padV}px ${padH}px`,
        transform: `rotate(${rotate}deg)`,
        boxShadow: shadowVal,
      }}
    >
      <span
        style={{
          fontFamily: '"Inter Tight", "Helvetica Neue", Arial, sans-serif',
          fontWeight: 700,
          fontSize,
          letterSpacing: '-0.05em',
          color: fg,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        {content}
      </span>
    </div>
  );
}
