import { Router } from "express"
import { InitializeController } from "#Controllers/initialize.controller"

export class InitializeRoute {
    router = Router()
    InitializeController = new InitializeController()

    constructor() {
        this.#initializeRoutes()
    }

    #initializeRoutes = () => {
        this.router.get('/', this.InitializeController.indexPage)
        this.router.post('/getMode', this.InitializeController.getMode)
    }
}