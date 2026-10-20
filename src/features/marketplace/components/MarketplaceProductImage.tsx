"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import { getMarketplaceImageSource } from "../imageUrl";

export function MarketplaceProductImage({ url, productId, alt }: Readonly<{ url?: string; productId: string; alt: string }>) {
  const [failed, setFailed] = useState(false);
  const source = getMarketplaceImageSource(url, productId);
  if (!source || failed) {
    return <Box role="img" aria-label={`${alt}: imagen no disponible`} sx={{ width: "100%", height: "100%", bgcolor: "#E7E7EE", display: "grid", placeItems: "center", color: "#696978", p: 1, textAlign: "center" }}>Imagen no disponible</Box>;
  }
  return <Box component="img" src={source} alt={alt} onError={() => setFailed(true)} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />;
}
