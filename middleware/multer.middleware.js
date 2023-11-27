import multer from 'multer'

export const uploadMiddleware = (source , { mode }) => {
    try {
        const storage = multer.memoryStorage()
        const upload = multer({ storage: storage })
        switch (mode) {
            case 'single' :
                return upload.single(source)
            case 'multiple' :
                return upload.fields(source)
            default :
                throw 'Multer mode error'
        }
    } catch (error) {
        next(error)
    }
}


