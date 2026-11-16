import { Box } from "@mui/material";

const scenes = [
  { sky: "#d7e9e9", ground: "#a7c6b8", panel: "#24466a", angle: "roof" },
  { sky: "#e8e7dc", ground: "#d6cfb5", panel: "#284363", angle: "pole" },
  { sky: "#8bd5e4", ground: "#70c7d4", panel: "#173d6a", angle: "stand" },
  { sky: "#cfe4c6", ground: "#608344", panel: "#253d62", angle: "field" },
] as const;

/** Ilustración local de respaldo para la maqueta; se reemplaza al integrar las fotos del catálogo. */
export function SolarProductArtwork({ variant = 0 }: Readonly<{ variant?: number }>) {
  const scene = scenes[variant % scenes.length];

  return (
    <Box
      aria-hidden="true"
      sx={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        bgcolor: scene.sky,
      }}
    >
      <svg viewBox="0 0 420 300" role="presentation" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`sky-${variant}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={scene.sky} />
            <stop offset="1" stopColor={scene.ground} />
          </linearGradient>
          <linearGradient id={`glass-${variant}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#52789d" />
            <stop offset="1" stopColor={scene.panel} />
          </linearGradient>
        </defs>
        <rect width="420" height="300" fill={`url(#sky-${variant})`} />
        <circle cx="340" cy="58" r="27" fill="#fff3c5" opacity=".8" />
        <path d="M0 225 Q100 198 198 228 T420 214 V300 H0Z" fill={scene.ground} opacity=".82" />
        {scene.angle === "roof" && <path d="M0 235 192 125 420 229 420 300 0 300Z" fill="#c08a5d" />}
        {scene.angle === "pole" && <path d="M200 165h18v126h-18z" fill="#4d493d" />}
        {scene.angle === "stand" && <path d="M180 110h14l-28 182h-14zM257 112h12l42 180h-14z" fill="#414c55" />}
        {scene.angle === "field" && <path d="M0 255 Q80 205 175 241 T420 240 V300 H0Z" fill="#466c3d" opacity=".65" />}
        <g transform={scene.angle === "roof" ? "translate(72 70) skewY(-10)" : "translate(104 74) rotate(-8 110 80)"}>
          <rect x="0" y="0" width="238" height="147" rx="6" fill="#d8d7cc" stroke="#f9f7ed" strokeWidth="7" />
          <rect x="6" y="6" width="226" height="135" rx="2" fill={`url(#glass-${variant})`} />
          {[1, 2, 3, 4, 5].map((row) => (
            <g key={`row-${row}`}>
              <path d={`M8 ${row * 22}H230`} stroke="#d7e4ed" strokeWidth="2.5" opacity=".92" />
              <path d={`M${row * 37} 7V140`} stroke="#d7e4ed" strokeWidth="2.5" opacity=".88" />
            </g>
          ))}
          <path d="M16 12 99 12 18 136Z" fill="#fff" opacity=".11" />
        </g>
        {scene.angle !== "roof" && <path d="M214 220 209 290M120 216 300 220" stroke="#514d3f" strokeWidth="8" strokeLinecap="round" />}
        <path d="M0 278 Q95 266 198 281 T420 275" stroke="#fff" strokeWidth="2" opacity=".25" fill="none" />
      </svg>
    </Box>
  );
}
