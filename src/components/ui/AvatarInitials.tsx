// Avatar SVG initiales — alternative honnete a la photo. Used pour les auteurs
// dont on ne dispose pas d'une photo officielle. Plus credible qu'une photo
// IA fake.

type Props = {
  name: string;
  color?: string;
  size?: number;
  className?: string;
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AvatarInitials({ name, color = "#1e3a8a", size = 80, className = "" }: Props) {
  const initials = getInitials(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`Avatar ${name}`}
    >
      <circle cx="40" cy="40" r="40" fill={color} />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".34em"
        fill="white"
        fontFamily="'Inter', sans-serif"
        fontSize="32"
        fontWeight="800"
        letterSpacing="-1"
      >
        {initials}
      </text>
    </svg>
  );
}
