import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.6", "localhost", "127.0.0.1", "teacher.dolcake.com", "teacher.localhost", "dolcake.com", "dolcake.local", "teacher.dolcake.local"],
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 50,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), {
        bufferutil: "commonjs bufferutil",
        "utf-8-validate": "commonjs utf-8-validate",
      }];
    }
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
    proxyClientMaxBodySize: '100mb',
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      'zustand',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
    ],
  },
  outputFileTracingExcludes: {
    '*': [
      './node_modules/@swc/core-linux-x64-gnu/**/*',
      './node_modules/@swc/core-linux-x64-musl/**/*',
      './node_modules/@esbuild/linux-x64/**/*',
      './node_modules/typescript/**/*',
      './node_modules/postcss/**/*',
      './node_modules/tailwindcss/**/*',
      './scratch/**/*',
      './.git/**/*',
    ],
  },
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: 'media.dolcake.com' },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/student/login',
        permanent: false,
      },
      // SEO: renamed slug redirects (permanent 301)
      {
        source: '/public/lessons/my-family-9919',
        destination: '/public/lessons/my-family',
        permanent: true,
      },
      {
        source: '/public/lessons/exploring-nature-1rkt',
        destination: '/public/lessons/exploring-nature',
        permanent: true,
      },
      // SEO: block duplicate "ban-sao" copy → redirect to original
      {
        source: '/public/lessons/exploring-the-world-of-animals-ban-sao',
        destination: '/public/lessons/exploring-the-world-of-animals',
        permanent: true,
      },
      // Serve heavy media inside /games/ from Cloudflare R2 while keeping HTML/JS/CSS same-origin
      {
        source: '/games/:path((?:.+/)?[^/]+\\.(?:png|jpg|jpeg|webp|gif|svg|wav|mp3|ogg))',
        destination: 'https://media.dolcake.com/games/:path',
        permanent: false,
      },
      // Fallback redirects for moved public media folders -> Cloudflare R2
      {
        source: '/sounds/:path*',
        destination: 'https://media.dolcake.com/sounds/:path*',
        permanent: false,
      },
      {
        source: '/assests/:path*',
        destination: 'https://media.dolcake.com/assests/:path*',
        permanent: false,
      },
      {
        source: '/images/:path*',
        destination: 'https://media.dolcake.com/images/:path*',
        permanent: false,
      },
      {
        source: '/guides/:path((?:.+/)?[^/]+\\.(?:png|jpg|jpeg|webp|gif|svg|mp4|webm))',
        destination: 'https://media.dolcake.com/guides/:path',
        permanent: false,
      },
    ];
  },
};

let configWithPlugins = withNextIntl(nextConfig);

if (process.env.ANALYZE === 'true') {
  try {
    // Dynamic import to prevent build errors if module is missing
    const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: true });
    configWithPlugins = withBundleAnalyzer(configWithPlugins);
  } catch (e) {
    console.warn('Could not load @next/bundle-analyzer:', e);
  }
}

export default configWithPlugins;
