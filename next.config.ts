import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.6", "localhost", "127.0.0.1"],
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
};

export default withNextIntl(nextConfig);
