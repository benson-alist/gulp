import type { NextConfig } from "next";

// Derive the API host from the env var the client uses, so uploaded photos
// served from the FastAPI ``/uploads/*`` mount pass Next.js' image loader.
// Falling back to the dev default keeps `npm run dev` zero-config.
const apiUrl = new URL(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000",
);

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: apiUrl.hostname,
        port: apiUrl.port || undefined,
        pathname: "/uploads/**",
      },
      // Also accept the localhost alias so devs hitting either name work.
      ...(apiUrl.hostname === "127.0.0.1"
        ? [
            {
              protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
              hostname: "localhost",
              port: apiUrl.port || undefined,
              pathname: "/uploads/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
