import { Router } from "express"
import { KBANKController } from "#Controllers/kbank.controller"
import { verifyInput } from "#middleware/verifyInput.middleware"
import { oAuthV2KBNAK } from "#middleware/auth.middleware"

export class BanksRoute {
    router = Router()

    kbank = new KBANKController()

    constructor() {
        this.#kbankRoutes()
    }

    #kbankRoutes = () => {
        this.router.post('/kbank/transfer/v2/verifyData', verifyInput , oAuthV2KBNAK, this.kbank.verifyData)
        this.router.post('/kbank/transfer/v2/fundtransfer', verifyInput , this.kbank.fundtransfer)
    }
}