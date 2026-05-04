import Image from "next/image";

interface Props {
  name?: string | null;
  image?: string | null;
  size?: number;
  className?: string;
}

const COLORS = [
  "#5BC5A7", "#60a5fa", "#f472b6", "#a78bfa",
  "#fbbf24", "#f87171", "#34d399", "#fb923c",
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function UserAvatar({ name, image, size = 40, className }: Props) {
  const displayName = name ?? "User";
  const initials = getInitials(displayName);
  const color = getColor(displayName);

  if (image) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
          position: "relative",
        }}
      >
        <Image
          src={image}
          alt={displayName}
          fill
          sizes={`${size}px`}
          style={{ objectFit: "cover" }}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#0f1117",
        fontWeight: 700,
        fontSize: size * 0.35,
        flexShrink: 0,
        fontFamily: "var(--font-display)",
      }}
    >
      {initials}
    </div>
  );
}
