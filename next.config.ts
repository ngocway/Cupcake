import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.6", "localhost", "127.0.0.1", "teacher.dolcake.com", "teacher.localhost", "dolcake.com", "dolcake.local", "teacher.dolcake.local"],
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
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.r2.dev' },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
  async redirects() {
    return [
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
