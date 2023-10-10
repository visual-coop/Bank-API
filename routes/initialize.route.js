import { Router } from "express"
import { InitializeController } from "#Controllers/initialize.controller"

export class InitializeRoute {
    router = Router()

    constructor() {
        this.#initializeRoutes()
    }

    #initializeRoutes () {
        this.router.get('/', InitializeController.indexPage())
        this.router.post('/getMode', InitializeController.getMode())
    }
}