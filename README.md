# 照片海报生成器 (Vercel 版)

为你的摄影作品生成专业的 EXIF 海报。

## 功能特性

- 📷 自动提取 EXIF 信息（相机、镜头、光圈、快门、ISO、焦距）
- 🎨 多款精美模板（经典白底、毛玻璃背景）
- 📥 支持 JPG/PNG 高质量导出
- ⚡ 部署在 Vercel，全球 CDN 加速

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 部署到 Vercel

1. Fork 此仓库
2. 在 [Vercel](https://vercel.com) 导入项目
3. 自动部署完成

## 技术栈

- Next.js 14 (App Router)
- Sharp (高性能图像处理)
- TypeScript
- Vercel Serverless Functions
