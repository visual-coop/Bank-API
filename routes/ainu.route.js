import { Router } from "express"
import { AinuController } from "#Controllers/ainu.controller"
import { ainuAuth } from "#middleware/auth.middleware"
import { uploadMiddleware } from "#middleware/multer.middleware"

export class AinuRoute {
    router = Router()
    ainu = new AinuController()

    constructor() {
        this.#ainuFace()
        this.#ainuThaiID()
    }

    #ainuFace = () => {
        this.router.get('/v1/face/quality/test', this.ainu.faceQualityimageUploader)
        this.router.post('/v1/face/quality', ainuAuth, uploadMiddleware('image' , { mode : 'single' }), this.ainu.faceQuality)
        const faceCompareBody = [
            { name : 'image1' },
            { name : 'image2' },
            { name : 'compareMode' },
            { name : 'checkQualityImage1' },
            { name : 'checkQualityImage2' }
        ]
        this.router.post('/v1/face/compare', ainuAuth, uploadMiddleware(faceCompareBody, { mode : 'multiple' }), this.ainu.faceCompare)
    }

    #ainuThaiID = () => {
        this.router.post('/v1/ocr/thaicard/front', ainuAuth, uploadMiddleware('image', { mode : 'single' }) , this.ainu.thaiIDFront)
        this.router.post('/v1/ocr/thaicard/back', ainuAuth, uploadMiddleware('image', { mode : 'single' }) , this.ainu.thaiIDBack)
        this.router.post('/v1/ocr/thaicard/portrait', ainuAuth, uploadMiddleware('image', { mode : 'single' }) , this.ainu.thaiIDPortrait)
    }
}