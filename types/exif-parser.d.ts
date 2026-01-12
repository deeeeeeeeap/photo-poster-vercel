declare module 'exif-parser' {
    interface ExifTags {
        Make?: string
        Model?: string
        LensModel?: string
        LensInfo?: string
        FocalLength?: number
        FNumber?: number
        ExposureTime?: number
        ISO?: number
        DateTimeOriginal?: string
        [key: string]: unknown
    }

    interface ExifResult {
        tags: ExifTags
        imageSize?: {
            width: number
            height: number
        }
        thumbnailOffset?: number
        thumbnailLength?: number
        thumbnailType?: number
        app1Offset?: number
    }

    interface ExifParser {
        parse(): ExifResult
    }

    function create(buffer: Buffer): ExifParser
    export = { create }
}
