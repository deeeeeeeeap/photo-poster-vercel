import { NextRequest, NextResponse } from 'next/server'
import ExifParser from 'exif-parser'

// EXIF 提取 API
export async function POST(request: NextRequest) {
    try {
        const { image } = await request.json()

        if (!image) {
            return NextResponse.json({ error: '缺少图片数据' }, { status: 400 })
        }

        // 移除 Data URL 前缀
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')

        // 解析 EXIF
        let exifData = {
            cameraMake: '未知',
            cameraModel: '未知',
            lensModel: '未知',
            focalLength: '未知',
            aperture: '未知',
            shutterSpeed: '未知',
            iso: '未知',
        }

        try {
            const parser = ExifParser.create(buffer)
            const result = parser.parse()
            const tags = result.tags

            // 提取相机信息
            if (tags.Make) exifData.cameraMake = String(tags.Make).trim()
            if (tags.Model) exifData.cameraModel = String(tags.Model).trim()

            // 提取镜头信息
            if (tags.LensModel) {
                exifData.lensModel = String(tags.LensModel).trim()
            } else if (tags.LensInfo) {
                exifData.lensModel = String(tags.LensInfo).trim()
            }

            // 焦距
            if (tags.FocalLength) {
                exifData.focalLength = `${Math.round(tags.FocalLength)}mm`
            }

            // 光圈
            if (tags.FNumber) {
                exifData.aperture = `f/${tags.FNumber}`
            }

            // 快门速度
            if (tags.ExposureTime) {
                const exposure = tags.ExposureTime
                if (exposure >= 1) {
                    exifData.shutterSpeed = `${exposure}s`
                } else {
                    exifData.shutterSpeed = `1/${Math.round(1 / exposure)}s`
                }
            }

            // ISO
            if (tags.ISO) {
                exifData.iso = String(tags.ISO)
            }

        } catch (parseError) {
            console.warn('EXIF 解析警告:', parseError)
            // 继续返回默认值
        }

        return NextResponse.json(exifData)

    } catch (error) {
        console.error('EXIF 提取错误:', error)
        return NextResponse.json(
            { error: '处理图片时发生错误' },
            { status: 500 }
        )
    }
}
