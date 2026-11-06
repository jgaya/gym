import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Meraki Centro de Entrenamiento",
    short_name: "Meraki",
    description: "Plataforma de entrenamiento, rutinas y seguimiento de Meraki Centro de Entrenamiento",
    start_url: "/",
    id: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#ea580c",
    orientation: "portrait-primary",
    scope: "/",
    lang: "es",
    categories: ["fitness", "sports", "health", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        src: "/icons/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/icons/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
      },
      {
        src: "/icons/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Mi Rutina",
        short_name: "Rutina",
        description: "Acceso rápido a tu rutina del día",
        url: "/mi-rutina",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Calendario",
        short_name: "Calendario",
        description: "Calendario de asistencias y entrenamientos",
        url: "/calendario",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}

