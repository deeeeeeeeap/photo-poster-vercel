/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用 Sharp 图像处理
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  // Sharp 外部包配置（Next.js 15 新语法）
  serverExternalPackages: ['sharp'],
}

module.exports = nextConfig
