import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ['jieba-wasm'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 确保WASM文件能被正确处理
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };
      
      // 添加WASM文件的处理规则
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'asset/resource',
      });
    }
    
    return config;
  },
  async headers() {
    return [
      {
        source: '/wasm/:path*',   // 匹配 /wasm/ 下所有文件
        headers: [
          { key: 'Content-Type', value: 'application/wasm' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*.wasm',   // 匹配所有WASM文件
        headers: [
          { key: 'Content-Type', value: 'application/wasm' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
