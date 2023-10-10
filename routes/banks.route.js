import { Router } from "express"

export class BanksRoute {
    router = Router()

    constructor() {
        this.#kbankRoutes()
    }

    #kbankRoutes () {
        this.router.post('/transfer/v2/verifyData', )
    }
}