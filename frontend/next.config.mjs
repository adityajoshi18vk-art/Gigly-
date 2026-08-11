/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          {
            // Allow Transak staging iframe to load inside our pages.
            // 'self' keeps all other same-origin frames working.
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https:",
              "connect-src 'self' https: wss:",
              // Permit embedding the Transak staging widget:
              "frame-src 'self' https://global-stg.transak.com https://global.transak.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
