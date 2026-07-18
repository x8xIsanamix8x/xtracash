import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "XtraCash",
    short_name: "XtraCash",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
  };
}
