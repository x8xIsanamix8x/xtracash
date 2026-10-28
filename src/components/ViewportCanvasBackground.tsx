import { GlobalStyles } from "@mui/material";

type ViewportCanvasBackgroundProps = Readonly<{
  color: string;
}>;

/**
 * Iguala el canvas raÃ­z al borde visual de una pantalla de alto completo.
 * iOS puede mostrar una franja de `html`/`body` fuera de `100dvh` en modo PWA.
 */
export function ViewportCanvasBackground({ color }: ViewportCanvasBackgroundProps) {
  return (
    <GlobalStyles
      styles={{
        html: { backgroundColor: color },
        body: { backgroundColor: color },
      }}
    />
  );
}
