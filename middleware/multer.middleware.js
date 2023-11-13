import multer from 'multer'

export const uploadMiddleware = (source) => {
    try {
        const storage = multer.memoryStorage()
        const upload = multer({ storage: storage })
        return upload.single(source)
    } catch (error) {
        next(error)
    }
}


