/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用 Sharp 图像处理
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  // Vercel Serverless Function 配置
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
}

module.exports = nextConfig
