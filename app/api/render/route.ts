import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { renderClassicTemplate } from '@/lib/templates/classic'
import { renderBlurBackgroundTemplate } from '@/lib/templates/blur-background'

// EXIF 数据类型
interface ExifData {
    cameraMake: string
    cameraModel: string
    lensModel: string
    focalLength: string
    aperture: string
    shutterSpeed: string
    iso: string
}

// 请求体类型
interface RenderRequest {
    image: string
    exif: ExifData
    template: string
    format: 'jpg' | 'png'
    quality?: number
}

// 海报渲染 API
export async function POST(request: NextRequest) {
    try {
        const body: RenderRequest = await request.json()
        const { image, exif, template, format, quality = 0.9 } = body

        if (!image) {
            return NextResponse.json({ error: '缺少图片数据' }, { status: 400 })
        }

        // 移除 Data URL 前缀并转换为 Buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
        const rawBuffer = Buffer.from(base64Data, 'base64')

        // 使用 Sharp 自动根据 EXIF Orientation 旋转图片
        const rotatedImage = sharp(rawBuffer).rotate()
        const imageBuffer = await rotatedImage.toBuffer()

        // 获取旋转后的实际尺寸
        const metadata = await sharp(imageBuffer).metadata()
        const width = metadata.width || 1920
        const height = metadata.height || 1080

        // 根据模板渲染
        let posterBuffer: Buffer

        if (template === 'blur-background') {
            posterBuffer = await renderBlurBackgroundTemplate(imageBuffer, width, height, exif)
        } else {
            // 默认使用经典模板
            posterBuffer = await renderClassicTemplate(imageBuffer, width, height, exif)
        }

        // 输出格式转换
        let outputBuffer: Buffer
        let contentType: string

        if (format === 'png') {
            outputBuffer = await sharp(posterBuffer).png().toBuffer()
            contentType = 'image/png'
        } else {
            outputBuffer = await sharp(posterBuffer)
                .jpeg({ quality: Math.round(quality * 100) })
                .toBuffer()
            contentType = 'image/jpeg'
        }

        return new NextResponse(new Uint8Array(outputBuffer), {
            headers: {
                'Content-Type': contentType,
                'Content-Length': String(outputBuffer.length),
            },
        })

    } catch (error) {
        console.error('渲染错误:', error)
        return NextResponse.json(
            { error: '渲染海报时发生错误' },
            { status: 500 }
        )
    }
}
