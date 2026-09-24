/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  swcMinify: true,
  staticPageGenerationTimeout: 60,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "date-fns",
      "clsx",
      "tailwind-merge",
      "react-markdown",
      "lenis",
    ],
    serverComponentsExternalPackages: ["archiver", "@aws-sdk/client-s3", "cloudinary", "@prisma/client", "prisma"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 192, 384],
    remotePatterns: [
      // Instagram CDN — reel thumbnails
      { protocol: "https", hostname: "*.cdninstagram.com" },
      { protocol: "https", hostname: "*.fbcdn.net" },
      // YouTube thumbnails for documentary pieces
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Cloudinary CDN
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Archival & Library Repositories (Internet Archive & Wikimedia Commons)
      { protocol: "https", hostname: "archive.org" },
      { protocol: "https", hostname: "*.archive.org" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "thumb.wikimedia.org" },
    ],
  },
  async headers() {
    return [
      {
        // Immutable caching for hashed static next chunks
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Public brand assets & static media
        source: "/(brand|icons)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Everything, cover route included.
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Link",
            value: "<https://res.cloudinary.com>; rel=preconnect; crossorigin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://us-assets.i.posthog.com https://us.i.posthog.com https://www.instagram.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://res.cloudinary.com https://*.cdninstagram.com https://*.fbcdn.net https://i.ytimg.com https://images.unsplash.com https://archive.org https://*.archive.org https://upload.wikimedia.org https://thumb.wikimedia.org",
              "media-src 'self' https://res.cloudinary.com data: blob:",
              "connect-src 'self' https://res.cloudinary.com https://us.i.posthog.com https://us-assets.i.posthog.com https://api.groq.com https://openrouter.ai",
              "frame-src 'self' https://www.instagram.com https://www.youtube.com https://www.youtube-nocookie.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Cache directives & content negotiation headers for public content only, never for /api or /admin routes
        source: "/:path((?!api|admin).*)",
        headers: [
          {
            key: "Vary",
            value: "Accept",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },
};

module.exports = nextConfig;
