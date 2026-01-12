import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: '照片海报生成器',
    description: '为你的摄影作品生成专业的 EXIF 海报',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="zh-CN">
            <body>{children}</body>
        </html>
    )
}
