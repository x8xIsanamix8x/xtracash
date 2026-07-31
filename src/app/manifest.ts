import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Impúlsate Móvil",
    short_name: "Impúlsate",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
  };
}
