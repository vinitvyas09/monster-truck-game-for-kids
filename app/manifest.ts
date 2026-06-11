import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Monster Garage",
    short_name: "Monster Garage",
    description: "Build a monster truck, then crush some cars!",
    start_url: "/",
    display: "fullscreen",
    orientation: "landscape",
    background_color: "#45c4f5",
    theme_color: "#45c4f5",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
