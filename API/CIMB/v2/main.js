import express from 'express'
import * as CIMB from '#libs/Functions_CIMB'
import * as lib from '#libs/Functions'
import { config_cimb_v2 } from '#API/CIMB/config'
import { get_init_config, CIMB_TOKEN } from '#cache/redis'
import { COOP_DB } from '#db/query'

const router = express.Router()
router.use(express.json())
router.use(express.urlencoded({
    extended: true,
    defer: true
}))

router.post('/test-get-base' , async (req, res) => {
    res.json(await COOP_DB.GET_LOGS(req.body))
})

const oAuthTokenV2CIMB = async (req, res, next) => {
    req.bank_api_path = await lib.bank_api_path()
    const CONFIGS_INIT = (JSON.parse(await get_init_config(config_cimb_v2.bank_name))).filter(result => result.coop_key === req.body.coop_key)[0]
    req.body = {
        ...CONFIGS_INIT,
        ...req.body
    }
    const arg_keys = [
        'public_key',
        'client_id',
        'client_secret',
        'client_ref_id',
        'channel_id',
        'enc_iv64',
        'enc_key64',
        'secret_key',
        'x_apigw_api_id',
        'unique_id'
    ]
    if (lib.checkCompleteArgument(arg_keys, req.body)) {
        if (await CIMB_TOKEN.GET(req.body.unique_id) && req.route.path == '/inquiryAccountCIMB') {
            const aesKey = CIMB.generateAESKey()
            const aesIV = CIMB.getIV(aesKey)
            const epoch = Math.floor(new Date().getTime() / 1000)
            const messageStr = aesKey + "|" + epoch
            const body = "{\"secret_key\": \"" + req.body.secret_key + "\",\"grant_type\": \"client_credentials\"}"
            const public_key = '-----BEGIN PUBLIC KEY-----\n' + req.body.public_key + '-----END PUBLIC KEY-----'
            req.request_id = `${lib.genGUID()}`
            const obj = {
                headers: {
                    client_id: req.body.client_id,
                    client_ref_id: req.body.client_ref_id,
                    "x-apigw-api-id": req.body.x_apigw_api_id,
                    request_id: req.body.request_id,
                    message: CIMB.RSApublicEncrypt(public_key, messageStr),
                },
                body: {
                    data: CIMB.AESencrypt(aesKey, aesIV, body)
                }
            }

            const Encrypted = await lib.RequestFunction.post(false, req.bank_api_path.oAuthTokenV2CIMB, obj.headers, obj.body)

            const Decrypted = CIMB.AESdecrypt(aesKey, aesIV, Encrypted.data.data)

            const jsonResponse = JSON.parse(Decrypted.toString())
            
            await CIMB_TOKEN.SET(req.body.unique_id, jsonResponse)
        }
        req.body.routePath = req.route.path
        next()
    } else {
        res.status(500).end(`Authorization error => Payload not compalte`)
    }
}

router.post('/inquiryAccountCIMB', oAuthTokenV2CIMB, async (req, res) => {
    const arg_keys = [
        'opay_encrypt_key64',
        'opay_encrypt_iv64',
        'destination',
        'amt_transfer',
        'trans_type',
        'unique_id'
    ]
    if (lib.checkCompleteArgument(arg_keys, req.body)) {
        const aesKey = CIMB.generateAESKey()
        const aesIV = CIMB.getIV(aesKey)
        const epoch = Math.floor(new Date().getTime() / 1000)
        const messageStr = aesKey + "|" + epoch
        const public_key = '-----BEGIN PUBLIC KEY-----\n' + req.body.public_key + '-----END PUBLIC KEY-----'

        const obj = {
            headers: {
                "Content-Type": "application/json",
                client_id: req.body.client_id,
                client_ref_id: req.body.client_ref_id,
                "x-apigw-api-id": req.body.x_apigw_api_id,
                request_id: req.body.request_id,
                message: CIMB.RSApublicEncrypt(public_key, messageStr),
                Authorization: `Bearer ${await CIMB_TOKEN.GET_AUTH(req.body.unique_id)}`
            },
            body: {
                data: CIMB.AESencrypt(aesKey, aesIV, JSON.stringify(CIMB.buildOPAYRequest(req.body)))
            }
        }

        const InquiryResult = await lib.RequestFunction.post(true, req.bank_api_path.inquiryAccountV2CIMB, obj.headers, obj.body)
            .catch(err => {
                res.end(`Inquiry error => ${err}`)
            })

        const Decrypted = CIMB.AESdecrypt(aesKey, aesIV, InquiryResult.data.data)

        const jsonResponse = JSON.parse(Decrypted.toString())

        const result = JSON.parse(CIMB.BodyDecrypt(req.body.opay_encrypt_key64, req.body.opay_encrypt_iv64, jsonResponse.data))

        res.status(200).json(result)
    } else {
        res.status(500).end(`Inquiry error => Payload not compalte`)
    }
})

router.post('/confirmFunsTransferCIMB', oAuthTokenV2CIMB, async (req, res) => {
    const arg_keys = [
        'opay_encrypt_key64',
        'opay_encrypt_iv64',
        'channel_id',
        'destination',
        'amt_transfer',
        'ClientTransactionNo',
        'unique_id'
    ]
    if (lib.checkCompleteArgument(arg_keys, req.body) && !!req.route.path) {
        const aesKey = CIMB.generateAESKey()
        const aesIV = CIMB.getIV(aesKey)
        const epoch = Math.floor(new Date().getTime() / 1000)
        const messageStr = aesKey + "|" + epoch
        const public_key = '-----BEGIN PUBLIC KEY-----\n' + req.body.public_key + '-----END PUBLIC KEY-----'

        const obj = {
            headers: {
                "Content-Type": "application/json",
                client_id: req.body.client_id,
                client_ref_id: req.body.client_ref_id,
                "x-apigw-api-id": req.body.x_apigw_api_id,
                request_id: `${lib.genGUID()}`,
                message: CIMB.RSApublicEncrypt(public_key, messageStr),
                Authorization: `Bearer ${await CIMB_TOKEN.GET_AUTH(req.body.unique_id)}`
            },
            body: {
                data: CIMB.AESencrypt(aesKey, aesIV, JSON.stringify(CIMB.buildOPAYRequest(req.body)))
            }
        }

        const ConfirmResult = await lib.RequestFunction.post(true, req.bank_api_path.confirmFunsTransferV2CIMB, obj.headers, obj.body)

        const Decrypted = CIMB.AESdecrypt(aesKey, aesIV, ConfirmResult.data.data)

        const jsonResponse = JSON.parse(Decrypted.toString())

        const result = JSON.parse(CIMB.BodyDecrypt(req.body.opay_encrypt_key64, req.body.opay_encrypt_iv64, jsonResponse.data))

        const log_in_payload = {
            // exp: 1627534828,
            coop_key: req.body.coop_key,
            ref_trans: {
                ClientTransactionNo: req.body.ClientTransactionNo
            },
            tran_date: lib.formatMysqlDate(new Date()),
            // citizen_id: null,
            amt_transfer: lib.pad_amt(req.body.amt_transfer),
            trans_type: req.body.trans_type,
            bank_account: req.body.destination,
            operate_date: `${lib.formatMysqlDate(new Date())}+07.00`,
            // coop_account_no: "000130002821"
        }

        const log_payload = {
            log_income: log_in_payload,
            trans_flag: '-1',
            coop_key: req.body.coop_key,
            log_response: result
        }

        await COOP_DB.SET_LOG(log_payload)
            .then( (res) => console.log("Confirm Successfully =>", res.log_response.ClientTransactionNo))
            .catch((err) => console.log(`Confirm error =>`, err))

        await CIMB_TOKEN.DEL(req.body.unique_id)

        res.status(200).json(result)
    } else {
        res.status(500).end(`Confirm error => Payload not compalte`)
    }
})

router.post('/getStatusV2CIMB', oAuthTokenV2CIMB, async (req, res) => {
    const arg_keys = [
        'opay_encrypt_key64',
        'opay_encrypt_iv64',
        'channel_id',
        'ClientTransactionNo',
        'TransactionID'
    ]
    if (CIMB.checkCompleteArgument(arg_keys, req.body) && !!req.route.path) {
        const aesKey = CIMB.generateAESKey()
        const aesIV = CIMB.getIV(aesKey)
        const epoch = Math.floor(new Date().getTime() / 1000)
        const messageStr = aesKey + "|" + epoch
        const public_key = '-----BEGIN PUBLIC KEY-----\n' + req.body.public_key + '-----END PUBLIC KEY-----'

        const obj = {
            headers: {
                "Content-Type": "application/json",
                client_id: req.body.client_id,
                client_ref_id: req.body.client_ref_id,
                "x-apigw-api-id": req.body.x_apigw_api_id,
                request_id: `${lib.genGUID()}`,
                message: CIMB.RSApublicEncrypt(public_key, messageStr),
                Authorization: `Bearer ${req.oAuth.access_token}`
            },
            body: {
                data: CIMB.AESencrypt(aesKey, aesIV, JSON.stringify(CIMB.buildOPAYRequest(req.body)))
            }
        }

        const ConfirmResult = await lib.RequestFunction.post(true, req.bank_api_path.getStatusV2CIMB, obj.headers, obj.body)

        const Decrypted = CIMB.AESdecrypt(aesKey, aesIV, ConfirmResult.data.data)

        const jsonResponse = JSON.parse(Decrypted.toString())

        const result = JSON.parse(CIMB.BodyDecrypt(req.body.opay_encrypt_key64, req.body.opay_encrypt_iv64, jsonResponse.data))

        res.status(200).json(result)
    } else {
        res.status(500).end(`Get status error => Payload not compalte`)
    }
})

export default router