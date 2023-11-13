import { Router } from "express"
import { AinuController } from "#Controllers/ainu.controller"
import { ainuAuth } from "#middleware/auth.middleware"
import { uploadMiddleware } from "#middleware/multer.middleware"

export class AinuRoute {
    router = Router()
    ainu = new AinuController()

    constructor() {
        this.#ainuRoutes()
    }

    #ainuRoutes = () => {
        this.router.get('/v1/face/quality/test', this.ainu.faceQualityimageUploader)
        this.router.post('/v1/face/quality', ainuAuth, uploadMiddleware('image'), this.ainu.faceQuality)
    }
}