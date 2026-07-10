interface IconProps { name: string; className?: string; filled?: boolean; size?: number; }
export function Icon({ name, className = '', filled = false, size = 20 }: IconProps) {
  return <span aria-hidden="true" className={`material-symbols-outlined select-none ${className}`} style={{ fontSize: size, lineHeight: 1, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}` }}>{name}</span>;
}
