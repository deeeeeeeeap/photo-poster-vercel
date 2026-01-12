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
 * 经典白底模板
 * 
 * 设计风格：
 * - 纯白背景，简洁大气
 * - 照片居中显示
 * - 下方显示相机型号和摄影参数
 */
export async function renderClassicTemplate(
    imageBuffer: Buffer,
    photoWidth: number,
    photoHeight: number,
    exif: ExifData
): Promise<Buffer> {
    // 计算尺寸比例
    const baseSize = Math.min(photoWidth, photoHeight)
    const padding = Math.round(baseSize * 0.05)
    const textAreaHeight = Math.round(baseSize * 0.15)

    // 画布尺寸
    const canvasWidth = photoWidth + padding * 2
    const canvasHeight = photoHeight + padding * 2 + textAreaHeight

    // 字体大小
    const fontCameraSize = Math.max(28, Math.round(baseSize * 0.035))
    const fontLensSize = Math.max(18, Math.round(baseSize * 0.02))
    const fontParamsSize = Math.max(22, Math.round(baseSize * 0.025))

    // 格式化相机型号
    const cameraModel = formatCameraModel(exif)
    const lensModel = exif.lensModel !== '未知' ? exif.lensModel : ''
    const paramsText = formatParams(exif)

    // 构建 SVG 文字层
    const textY1 = photoHeight + padding * 2 + fontCameraSize
    const textY2 = textY1 + fontLensSize + 8
    const textY3 = textY2 + fontParamsSize + 16

    const textSvg = `
    <svg width="${canvasWidth}" height="${canvasHeight}">
      <style>
        .camera { font-family: sans-serif; font-size: ${fontCameraSize}px; font-weight: bold; fill: #1a1a1a; }
        .lens { font-family: sans-serif; font-size: ${fontLensSize}px; fill: #666666; }
        .params { font-family: sans-serif; font-size: ${fontParamsSize}px; fill: #1a1a1a; letter-spacing: 0.1em; }
      </style>
      <text x="50%" y="${textY1}" text-anchor="middle" class="camera">${escapeXml(cameraModel)}</text>
      ${lensModel ? `<text x="50%" y="${textY2}" text-anchor="middle" class="lens">${escapeXml(lensModel)}</text>` : ''}
      <line x1="${canvasWidth * 0.3}" y1="${textY2 + 10}" x2="${canvasWidth * 0.7}" y2="${textY2 + 10}" stroke="#dddddd" stroke-width="1"/>
      <text x="50%" y="${textY3}" text-anchor="middle" class="params">${escapeXml(paramsText)}</text>
    </svg>
  `

    // 创建白色画布并合成
    const poster = await sharp({
        create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 3,
            background: { r: 255, g: 255, b: 255 },
        },
    })
        .composite([
            // 照片
            {
                input: imageBuffer,
                top: padding,
                left: padding,
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

// 格式化相机型号（移除重复的制造商名称）
function formatCameraModel(exif: ExifData): string {
    const make = exif.cameraMake?.toUpperCase() || ''
    let model = exif.cameraModel || '未知相机'

    // 如果型号已包含制造商名称，不再添加
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
