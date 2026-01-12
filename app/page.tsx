'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { setImageData } from '@/lib/storage'

export default function HomePage() {
    const [isDragOver, setIsDragOver] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    // 处理文件选择
    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('请选择有效的图片文件')
            return
        }

        // 检查文件大小（50MB 限制）
        if (file.size > 50 * 1024 * 1024) {
            setError('图片大小超过 50MB 限制')
            return
        }

        setIsUploading(true)
        setError(null)

        try {
            // 转换为 Base64
            const base64 = await fileToBase64(file)

            // 调用 EXIF 提取 API
            const response = await fetch('/api/exif', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64 }),
            })

            if (!response.ok) {
                throw new Error('EXIF 提取失败')
            }

            const exifData = await response.json()

            // 使用 IndexedDB 存储大图片数据
            await setImageData('posterData', {
                image: base64,
                exif: exifData,
                fileName: file.name,
            })

            router.push('/poster')
        } catch (err) {
            setError(err instanceof Error ? err.message : '处理图片时发生错误')
        } finally {
            setIsUploading(false)
        }
    }

    // File to Base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }

    // 拖放事件
    const handleDragOver = (e: DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = () => {
        setIsDragOver(false)
    }

    const handleDrop = (e: DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
    }

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>
                <h1>📷 照片海报生成器</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
                    上传照片，自动提取 EXIF 信息，生成专业摄影海报
                </p>
            </div>

            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div
                    className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleClick}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleInputChange}
                        style={{ display: 'none' }}
                    />

                    {isUploading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            <span>正在处理...</span>
                        </div>
                    ) : (
                        <>
                            <div className="upload-icon">📸</div>
                            <p className="upload-text">点击或拖放图片到此处</p>
                            <p className="upload-hint">支持 JPG、PNG 格式，最大 50MB</p>
                        </>
                    )}
                </div>

                {error && (
                    <p style={{ color: 'var(--error-color)', marginTop: '1rem', textAlign: 'center' }}>
                        {error}
                    </p>
                )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-secondary)' }}>
                <p>支持相机: Nikon, Canon, Sony, Fujifilm, Leica 等</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', opacity: 0.7 }}>
                    自动识别相机型号、镜头、光圈、快门、ISO、焦距
                </p>
            </div>
        </div>
    )
}
