import { Router } from "express"
import { KBANKController } from "#Controllers/kbank.controller"
import { CIMBContoller } from "#Controllers/cimb.controller"
import { verifyInput } from "#middleware/verifyInput.middleware"
import { oAuthV2KBNAK , oAuthV2CIMB } from "#middleware/auth.middleware"

export class BanksRoute {
    router = Router()
    kbank = new KBANKController()
    cimb = new CIMBContoller()

    constructor() {
        this.#kbankRoutes()
        this.#cimbRoutes()
    }

    #kbankRoutes = () => {
        this.router.post('/kbank/transfer/v2/verifyData', verifyInput , oAuthV2KBNAK, this.kbank.verifyData)
        this.router.post('/kbank/transfer/v2/fundtransfer', verifyInput , this.kbank.fundtransfer)
        this.router.post('/kbank/transfer/v2/reconcile' , this.kbank.reconcile)
    }

    #cimbRoutes = () => {
        this.router.post('/cimb/transfer/v2/inquiryAccountCIMB' , verifyInput, oAuthV2CIMB, this.cimb.inquiryAccountCIMB)
        this.router.post('/cimb/transfer/v2/confirmFunsTransferCIMB' , verifyInput, this.cimb.confirmFunsTransferCIMB)
        this.router.post('/cimb/transfer/v2/getStatusV2CIMB' , verifyInput, this.cimb.getStatusV2CIMB)
    }
}