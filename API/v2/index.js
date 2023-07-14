import express from 'express'
import * as func from '../../util/Function.js'
import config_bankurl from '../../../coopdirect-service/coopdirect/config/config_bankurl.json' assert {type: 'json'}

const router = express.Router()
router.use(express.json())
router.use(express.urlencoded({
    extended: true,
    defer: true
}))

const oAuthTokenV2CIMB = async (req, res, next) => {
    const aesKey = func.generateAESKey()
    const aesIV = func.getIV(aesKey)
    const epoch = Math.floor(new Date().getTime() / 1000)
    const messageStr = aesKey + "|" + epoch
    const body = "{\"secret_key\": \"" + req.body.secret_key + "\",\"grant_type\": \"client_credentials\"}"
    const public_key = '-----BEGIN PUBLIC KEY-----\n' + req.body.public_key + '-----END PUBLIC KEY-----'
    req.request_id = `${func.genGUID()}`
    const obj = {
        headers: {
            client_id: req.body.client_id,
            client_ref_id: req.body.client_ref_id,
            "x-apigw-api-id": req.body.x_apigw_api_id,
            request_id: req.request_id,
            message: func.RSApublicEncrypt(public_key, messageStr),
        },
        body: {
            data: func.AESencrypt(aesKey, aesIV, body)
        }
    }

    const Encrypted = await func.RequestFunction(false, config_bankurl.oAuthTokenV2CIMB, obj.headers, obj.body)

    const Decrypted = func.AESdecrypt(aesKey, aesIV, Encrypted.data.data)

    const jsonResponse = JSON.parse(Decrypted.toString())

    req.oAuth = jsonResponse
    next()
}

router.post('/inquiryAccountCIMB', oAuthTokenV2CIMB, async (req, res) => {
    const aesKey = func.generateAESKey()
    const aesIV = func.getIV(aesKey)
    const epoch = Math.floor(new Date().getTime() / 1000)
    const messageStr = aesKey + "|" + epoch
    const public_key = '-----BEGIN PUBLIC KEY-----\n' + req.body.public_key + '-----END PUBLIC KEY-----'

    const obj = {
        headers: {
            "Content-Type": "application/json",
            client_id: req.body.client_id,
            client_ref_id: req.body.client_ref_id,
            "x-apigw-api-id": req.body.x_apigw_api_id,
            request_id: req.request_id,
            message: func.RSApublicEncrypt(public_key, messageStr),
            Authorization: `Bearer ${req.oAuth.access_token}`
        },
        body: {
            data: func.AESencrypt(aesKey, aesIV, JSON.stringify(func.buildOPAYRequest(req.body))
            )
        }
    }

    const InquiryResult = await func.RequestFunction(true, config_bankurl.inquiryAccountV2CIMB, obj.headers, obj.body)
        .catch(err => {
            res.end(`Inquiry error => ${err}`)
        })

    const Decrypted = func.AESdecrypt(aesKey, aesIV, InquiryResult.data.data)

    const jsonResponse = JSON.parse(Decrypted.toString())

    const result = JSON.parse(func.BodyDecrypt(req.body.opay_encrypt_key64, req.body.opay_encrypt_iv64, jsonResponse.data))

    res.status(200).json(result)
})

router.post('/confirmFunsTransferCIMB', oAuthTokenV2CIMB, async (req, res) => {
    req.body.routePath = req.route.path
    const aesKey = func.generateAESKey()
    const aesIV = func.getIV(aesKey)
    const epoch = Math.floor(new Date().getTime() / 1000)
    const messageStr = aesKey + "|" + epoch
    const public_key = '-----BEGIN PUBLIC KEY-----\n' + req.body.public_key + '-----END PUBLIC KEY-----'

    const obj = {
        headers: {
            "Content-Type": "application/json",
            client_id: req.body.client_id,
            client_ref_id: req.body.client_ref_id,
            "x-apigw-api-id": req.body.x_apigw_api_id,
            request_id: `${func.genGUID()}`,
            message: func.RSApublicEncrypt(public_key, messageStr),
            Authorization: `Bearer ${req.oAuth.access_token}`
        },
        body: {
            data: func.AESencrypt(aesKey, aesIV, JSON.stringify(func.buildOPAYRequest(req.body)))
        }
    }

    const ConfirmResult = await func.RequestFunction(true, config_bankurl.confirmFunsTransferV2CIMB, obj.headers, obj.body)

    const Decrypted = func.AESdecrypt(aesKey, aesIV, ConfirmResult.data.data)

    const jsonResponse = JSON.parse(Decrypted.toString())

    const result = JSON.parse(func.BodyDecrypt(req.body.opay_encrypt_key64, req.body.opay_encrypt_iv64, jsonResponse.data))

    const log_payload = {
        log_income: obj,
        trans_flag: '-1',
        coop_key: 'egat',
        log_response: result
    }

    await func.SET_LOG(log_payload)
        .then(res => console.log("Confirm Successfully =>", res.log_response.ClientTransactionNo))
        .catch(err => console.log(`Confirm error =>` , err))

    res.status(200).json(result)

})

router.post('/getStatusV2CIMB', oAuthTokenV2CIMB, async (req, res) => {
    req.body.routePath = req.route.path
    const aesKey = func.generateAESKey()
    const aesIV = func.getIV(aesKey)
    const epoch = Math.floor(new Date().getTime() / 1000)
    const messageStr = aesKey + "|" + epoch
    const public_key = '-----BEGIN PUBLIC KEY-----\n' + req.body.public_key + '-----END PUBLIC KEY-----'

    const obj = {
        headers: {
            "Content-Type": "application/json",
            client_id: req.body.client_id,
            client_ref_id: req.body.client_ref_id,
            "x-apigw-api-id": req.body.x_apigw_api_id,
            request_id: `${func.genGUID()}`,
            message: func.RSApublicEncrypt(public_key, messageStr),
            Authorization: `Bearer ${req.oAuth.access_token}`
        },
        body: {
            data: func.AESencrypt(aesKey, aesIV, JSON.stringify(func.buildOPAYRequest(req.body)))
        }
    }

    const ConfirmResult = await func.RequestFunction(true, config_bankurl.getStatusV2CIMB, obj.headers, obj.body)

    const Decrypted = func.AESdecrypt(aesKey, aesIV, ConfirmResult.data.data)

    const jsonResponse = JSON.parse(Decrypted.toString())

    const result = JSON.parse(func.BodyDecrypt(req.body.opay_encrypt_key64, req.body.opay_encrypt_iv64, jsonResponse.data))

    res.status(200).json(result)
})

export default router