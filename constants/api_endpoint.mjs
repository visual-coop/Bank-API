export default {
    kbank: {
        sandbox: {
            oAuthV2: "https://openapi-sandbox.kasikornbank.com/v2/oauth/token",
            inquiryAC: "https://openapi-sandbox.kasikornbank.com/v1/fundtransfer/verifydata",
            tranferAC: "https://openapi-sandbox.kasikornbank.com/v1/fundtransfer/fundtransfer",
            inquiryOtherBankAC: "https://openapi-sandbox.kasikornbank.com/v1/fundtransfer/verifydata",
            transferOtherBankAC: "https://openapi-sandbox.kasikornbank.com/v1/fundtransfer/verifydata",
            twoway_ssl : "https://openapi-test.kasikornbank.com/exercise/ssl"
        },
        UAT: {
            oAuthV2: "https://openapi-test.kasikornbank.com/v2/oauth/token",
            verifyData: "https://openapi-test.kasikornbank.com/fundtransfer/verifydata",
            fundTransfer: "https://openapi-test.kasikornbank.com/fundtransfer/fundtransfer",
            inqueryTxnStatus: "https://openapi-test.kasikornbank.com/fundtransfer/inqtxnstatus"
        },
        PROD: {
            oAuthV2: "https://openapi.kasikornbank.com/v2/oauth/token",
            verifyData: "https://openapi.kasikornbank.com/fundtransfer/verifydata",
            fundTransfer: "https://openapi.kasikornbank.com/fundtransfer/fundtransfer",
            inqueryTxnStatus: "https://openapi.kasikornbank.com/fundtransfer/inqtxnstatus"
        }
    }
}