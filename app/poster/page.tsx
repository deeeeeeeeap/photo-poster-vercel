'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getImageData, deleteImageData } from '@/lib/storage'

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

// 海报数据类型
interface PosterData {
    image: string
    exif: ExifData
    fileName: string
}

// 模板配置
const templates = [
    { id: 'classic', name: '经典白底', desc: '简洁大气的白色背景' },
    { id: 'blur-background', name: '毛玻璃背景', desc: '照片周围显示模糊背景边框' },
]

export default function PosterPage() {
    const router = useRouter()
    const [posterData, setPosterData] = useState<PosterData | null>(null)
    const [selectedTemplate, setSelectedTemplate] = useState('classic')
    const [format, setFormat] = useState<'jpg' | 'png'>('jpg')
    const [isRendering, setIsRendering] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // 从 IndexedDB 加载数据
    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await getImageData<PosterData>('posterData')
                if (!data) {
                    router.push('/')
                    return
                }
                setPosterData(data)
            } catch (err) {
                console.error('加载数据失败:', err)
                router.push('/')
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [router])

    // 模板切换时重新渲染预览
    useEffect(() => {
        if (posterData && !isLoading) {
            renderPreview()
        }
    }, [selectedTemplate, posterData, isLoading])

    // 渲染预览
    const renderPreview = async () => {
        if (!posterData) return

        setIsRendering(true)
        try {
            const response = await fetch('/api/render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: posterData.image,
                    exif: posterData.exif,
                    template: selectedTemplate,
                    format: 'jpg',
                    quality: 0.8, // 预览使用较低质量
                }),
            })

            if (!response.ok) throw new Error('渲染失败')

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)

            // 释放旧的 URL
            if (previewUrl) URL.revokeObjectURL(previewUrl)
            setPreviewUrl(url)
        } catch (err) {
            console.error('预览渲染失败:', err)
        } finally {
            setIsRendering(false)
        }
    }

    // 下载海报
    const downloadPoster = async () => {
        if (!posterData) return

        setIsRendering(true)
        try {
            const response = await fetch('/api/render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: posterData.image,
                    exif: posterData.exif,
                    template: selectedTemplate,
                    format,
                    quality: format === 'jpg' ? 0.9 : undefined,
                }),
            })

            if (!response.ok) throw new Error('渲染失败')

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)

            // 触发下载
            const a = document.createElement('a')
            a.href = url
            const baseName = posterData.fileName.replace(/\.[^.]+$/, '')
            a.download = `${baseName}_poster.${format}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error('下载失败:', err)
            alert('下载失败，请重试')
        } finally {
            setIsRendering(false)
        }
    }

    // 返回首页时清理数据
    const handleBack = async () => {
        await deleteImageData('posterData')
        router.push('/')
    }

    if (isLoading) {
        return (
            <div className="container">
                <div className="loading" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner"></div>
                    <span>加载中...</span>
                </div>
            </div>
        )
    }

    if (!posterData) {
        return null
    }

    const { exif } = posterData

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>🎨 海报预览</h1>
                <button className="btn btn-secondary" onClick={handleBack}>
                    ← 返回上传
                </button>
            </div>

            {/* 模板选择 */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2>选择模板</h2>
                <div className="template-grid">
                    {templates.map((t) => (
                        <div
                            key={t.id}
                            className={`template-card ${selectedTemplate === t.id ? 'active' : ''}`}
                            onClick={() => setSelectedTemplate(t.id)}
                        >
                            <div className="template-name">{t.name}</div>
                            <div className="template-desc">{t.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 预览和信息 */}
            <div className="preview-container">
                {/* 左侧预览 */}
                <div className="card">
                    {isRendering && !previewUrl ? (
                        <div className="loading" style={{ minHeight: '400px' }}>
                            <div className="spinner"></div>
                            <span>正在渲染...</span>
                        </div>
                    ) : previewUrl ? (
                        <img src={previewUrl} alt="海报预览" className="preview-image" />
                    ) : null}
                </div>

                {/* 右侧信息面板 */}
                <div>
                    <div className="card exif-panel">
                        <h2>📊 EXIF 信息</h2>
                        <div className="exif-item">
                            <span className="exif-label">相机</span>
                            <span className="exif-value">{exif.cameraModel || '未知'}</span>
                        </div>
                        <div className="exif-item">
                            <span className="exif-label">镜头</span>
                            <span className="exif-value">{exif.lensModel || '未知'}</span>
                        </div>
                        <div className="exif-item">
                            <span className="exif-label">焦距</span>
                            <span className="exif-value">{exif.focalLength || '未知'}</span>
                        </div>
                        <div className="exif-item">
                            <span className="exif-label">光圈</span>
                            <span className="exif-value">{exif.aperture || '未知'}</span>
                        </div>
                        <div className="exif-item">
                            <span className="exif-label">快门</span>
                            <span className="exif-value">{exif.shutterSpeed || '未知'}</span>
                        </div>
                        <div className="exif-item">
                            <span className="exif-label">ISO</span>
                            <span className="exif-value">{exif.iso || '未知'}</span>
                        </div>
                    </div>

                    {/* 下载区域 */}
                    <div className="card" style={{ marginTop: '1rem' }}>
                        <h2>📥 下载海报</h2>

                        <div className="format-select">
                            <button
                                className={`format-btn ${format === 'jpg' ? 'active' : ''}`}
                                onClick={() => setFormat('jpg')}
                            >
                                JPG
                            </button>
                            <button
                                className={`format-btn ${format === 'png' ? 'active' : ''}`}
                                onClick={() => setFormat('png')}
                            >
                                PNG
                            </button>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            onClick={downloadPoster}
                            disabled={isRendering}
                        >
                            {isRendering ? '渲染中...' : '下载海报'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
