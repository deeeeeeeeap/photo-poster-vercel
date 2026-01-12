import sharp from 'sharp'

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

/**
 * 毛玻璃背景模板
 * 
 * 设计风格：
 * - 照片背景使用模糊处理
 * - 照片居中显示
 * - 下方显示相机信息
 */
export async function renderBlurBackgroundTemplate(
    imageBuffer: Buffer,
    photoWidth: number,
    photoHeight: number,
    exif: ExifData
): Promise<Buffer> {
    const baseSize = Math.min(photoWidth, photoHeight)

    // 边框和水印区域
    const borderWidth = Math.round(baseSize * 0.08)
    const watermarkHeight = Math.round(baseSize * 0.18)

    // 画布尺寸
    const canvasWidth = photoWidth + borderWidth * 2
    const canvasHeight = photoHeight + borderWidth * 2 + watermarkHeight

    // 字体大小
    const fontBrandSize = Math.max(28, Math.round(baseSize * 0.045))
    const fontLensSize = Math.max(18, Math.round(baseSize * 0.02))
    const fontParamsSize = Math.max(22, Math.round(baseSize * 0.028))

    // 创建模糊背景
    // 1. 裁剪到目标比例
    const blurredBackground = await sharp(imageBuffer)
        .resize(canvasWidth, canvasHeight, {
            fit: 'cover',
            position: 'center',
        })
        // 2. 应用高斯模糊
        .blur(50)
        // 3. 降低亮度
        .modulate({ brightness: 0.8 })
        .toBuffer()

    // 格式化文字
    const cameraModel = formatCameraModel(exif)
    const lensModel = exif.lensModel !== '未知' ? exif.lensModel : ''
    const paramsText = formatParams(exif)

    // 文字位置
    const textStartY = photoHeight + borderWidth * 2 + Math.round(borderWidth * 0.5)
    const textY1 = textStartY + fontBrandSize
    const textY2 = textY1 + fontLensSize + 8
    const textY3 = textY2 + fontParamsSize + 20

    // 构建 SVG 文字层（白色文字带阴影）
    const textSvg = `
    <svg width="${canvasWidth}" height="${canvasHeight}">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>
      <style>
        .camera { font-family: sans-serif; font-size: ${fontBrandSize}px; font-weight: bold; fill: white; filter: url(#shadow); }
        .lens { font-family: sans-serif; font-size: ${fontLensSize}px; fill: rgba(255,255,255,0.85); filter: url(#shadow); }
        .params { font-family: sans-serif; font-size: ${fontParamsSize}px; fill: white; letter-spacing: 0.12em; filter: url(#shadow); }
      </style>
      <text x="50%" y="${textY1}" text-anchor="middle" class="camera">${escapeXml(cameraModel)}</text>
      ${lensModel ? `<text x="50%" y="${textY2}" text-anchor="middle" class="lens">${escapeXml(lensModel)}</text>` : ''}
      <text x="50%" y="${textY3}" text-anchor="middle" class="params">${escapeXml(paramsText)}</text>
    </svg>
  `

    // 合成最终海报
    const poster = await sharp(blurredBackground)
        .composite([
            // 底部渐变遮罩（增强文字可读性）
            {
                input: {
                    create: {
                        width: canvasWidth,
                        height: watermarkHeight + borderWidth,
                        channels: 4,
                        background: { r: 0, g: 0, b: 0, alpha: 0.3 },
                    },
                },
                top: canvasHeight - watermarkHeight - borderWidth,
                left: 0,
                blend: 'over',
            },
            // 主照片
            {
                input: imageBuffer,
                top: borderWidth,
                left: borderWidth,
            },
            // 文字层
            {
                input: Buffer.from(textSvg),
                top: 0,
                left: 0,
            },
        ])
        .jpeg({ quality: 95 })
        .toBuffer()

    return poster
}

// 格式化相机型号
function formatCameraModel(exif: ExifData): string {
    const make = exif.cameraMake?.toUpperCase() || ''
    let model = exif.cameraModel || '未知相机'

    if (model.toUpperCase().includes(make)) {
        return model
    }

    return `${exif.cameraMake} ${model}`.trim()
}

// 格式化拍摄参数
function formatParams(exif: ExifData): string {
    const parts = []

    if (exif.focalLength && exif.focalLength !== '未知') {
        parts.push(exif.focalLength)
    }
    if (exif.aperture && exif.aperture !== '未知') {
        parts.push(exif.aperture)
    }
    if (exif.shutterSpeed && exif.shutterSpeed !== '未知') {
        parts.push(exif.shutterSpeed)
    }
    if (exif.iso && exif.iso !== '未知') {
        parts.push(`ISO ${exif.iso}`)
    }

    return parts.join('   ')
}

// XML 转义
function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}
