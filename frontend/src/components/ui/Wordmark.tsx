interface WordmarkProps {
  size?: number;
  color?: string;
  accentColor?: string;
  className?: string;
}

export default function Wordmark({
  size = 28,
  color = '#0A0A0A',
  accentColor = '#7B7FE0',
  className = '',
}: WordmarkProps) {
  return (
    <span
      className={className}
      style={{
        fontFamily: '"Inter Tight", "Helvetica Neue", Arial, sans-serif',
        fontWeight: 700,
        fontSize: size,
        color,
        letterSpacing: '-0.05em',
        lineHeight: 0.9,
      }}
    >
      LENZU<span style={{ color: accentColor }}>.</span>
    </span>
  );
}
