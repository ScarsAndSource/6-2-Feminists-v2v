export function TextReveal({
  text,
  className = '',
  delay = 0,
  staggerMs = 40,
}: {
  text: string;
  className?: string;
  delay?: number;
  staggerMs?: number;
}) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className="text-reveal-word"
          style={{ animationDelay: `${delay + i * staggerMs}ms` }}
        >
          {word}
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </span>
  );
}
