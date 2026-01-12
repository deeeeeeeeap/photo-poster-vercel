/**
 * IndexedDB 存储工具
 * 用于存储大型图片数据（sessionStorage 只有 5MB 限制）
 */

const DB_NAME = 'PosterGeneratorDB'
const STORE_NAME = 'images'
const DB_VERSION = 1

// 打开数据库
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME)
            }
        }
    })
}

// 存储数据
export async function setImageData(key: string, data: unknown): Promise<void> {
    const db = await openDB()
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.put(data, key)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()

        transaction.oncomplete = () => db.close()
    })
}

// 读取数据
export async function getImageData<T>(key: string): Promise<T | null> {
    const db = await openDB()
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(key)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result || null)

        transaction.oncomplete = () => db.close()
    })
}

// 删除数据
export async function deleteImageData(key: string): Promise<void> {
    const db = await openDB()
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.delete(key)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()

        transaction.oncomplete = () => db.close()
    })
}
