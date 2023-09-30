import express from 'express'
import configs from '#constants/configs'
import moment from 'moment'
import * as KBANK from "#API/KBANK/v2/function"
import * as lib from '#libs/Functions'
import { config_kbank_v2 } from "#API/KBANK/config"
import * as endpoint from '#constants/api_endpoint'
import { token_session } from '#cache/redis'
import { DB_KBANK } from '#db/query'
import { decodedJWT } from '#middleware/verify_input'

const API = express.Router()
API.use(express.json())
API.use(express.urlencoded({
    extended: true,
    defer: true
}))

const mode = "UAT"

const oAuthV2 = async (req, res, next) => {
    const Credential = `${config_kbank_v2.credentials[mode].consumer_id}:${config_kbank_v2.credentials[mode].consumer_secret}`

    try {
        if (await token_session.GET(req.body.unique_key, config_kbank_v2.bank_name)) {
            console.log('session in =>', req.body.unique_key)
            const obj = {
                headers: {
                    "Authorization": `Basic ${KBANK.Base64Encoded(Credential)}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                    //"env-id": "OAUTH2",
                    "x-test-mode": "true"
                },
                body: {
                    "grant_type": "client_credentials"
                }
            }
            const result = await lib.RequestFunction.post(true, endpoint.default.kbank[mode].oAuthV2, obj.headers, obj.body, { ssl : KBANK.httpsAgent})
            await token_session.SET(req.body.unique_key, config_kbank_v2.bank_name, result.data)
        }
        next()
    } catch (error) {
        console.error(`[${lib.c_time()}][Authorization] Unauthorized => ${error}`)
        res.status(500).end(`[${lib.c_time()}][Authorization] Unauthorized => ${error}`)
    }
}

API.post('/inquiryAC', decodedJWT, oAuthV2, async (req, res) => {
    const { unique_key, coop_key , customerMobileNo } = req.body
    try {
        const merchant_id = await DB_KBANK.GetMerchantID(coop_key)
        const obj = {
            headers: {
                "Authorization": `Bearer ${(await token_session.GET_RAW(unique_key, config_kbank_v2.bank_name)).access_token}`,
                "Content-Type": "application/json",
                //"env-id": req.headers['env-id'],
                //"x-test-mode": req.headers['x-test-mode']
            },
            body: {
                amount: req.body.amount,
                fromAccountNo: "0481418100", //req.body.deptaccount_no,
                merchantID: merchant_id,
                merchantTransID: `${merchant_id}_${moment().format('YYYYMMDD')}_${req.body.ref_no}`,
                proxyType: "10",
                proxyValue: req.body.bank_account_no,
                requestDateTime: "2022-01-01T13:36:00.005+07:00",
                senderName: req.body.senderName,
                senderTaxID: req.body.citizen_id,
                toBankCode: "004",
                transType: "K2K",
                typeOfSender: "K"
            }
        }
        const result = await lib.RequestFunction.post(true, endpoint.default.kbank[mode].verifyData, obj.headers, obj.body , { ssl : KBANK.httpsAgent})
        const verify_result = {
            ACCOUNT_NAME : result.data.toAccNameTH,
            ACCOUNT_NAME_EN : result.data.toAccNameEN,
            CUSTOMER_MOBILE_NO : customerMobileNo,
            REF_KBANK : result.data.merchantTransID,
            CITIZEN_ID_ENC : result.data.senderTaxID,
            BANK_ACCOUNT_ENC : result.data.proxyValue,
            TRAN_ID : result.data.rsTransID,
            RESULT : true
        }
        res.status(200).json(verify_result)
    } catch (error) {
        console.error(`[${lib.c_time()}][${req.originalUrl}] Error => ${error}`)
        const send_res = {
            ResponseCode: "KBANKERR02",
            message: error,
            RESULT : false
        }
        res.status(500).json(send_res)
    }
})

API.post('/transferAC', decodedJWT, oAuthV2, async (req, res) => {
    try {
        const obj = {
            headers: {
                "Authorization": `Bearer ${(await token_session.GET_RAW(req.body.unique_key, config_kbank_v2.bank_name)).access_token}`,
                "Content-Type": "application/json",
                "env-id": req.headers['env-id'],
                "x-test-mode": req.headers['x-test-mode']
            },
            body: { ...req.body.payload }
        } //moment().format('yyyy-MM-DDTHH:mm:ss:SSS+07:00'),
        const result = await lib.RequestFunction.post(true, endpoint.default.kbank[mode].tranferAC, obj.headers, obj.body, { ssl : KBANK.httpsAgent})

        //await token_session.DEL(req.body.unique_key,config_kbank_v2.bank_name)

        res.status(200).json(result.data)
    } catch (error) {
        console.error(`[${lib.c_time()}][${req.originalUrl}] Error => ${error}`)
        const send_res = {
            ResponseCode: "KTBERR02",
            message: error
        }
        res.status(500).json(send_res)
    }
})

API.post('/inquiryOtherBankAC', oAuthV2, async (req, res) => {

    try {
        const obj = {
            headers: {
                "Authorization": `Bearer ${(await token_session.GET_RAW(req.body.unique_key, config_kbank_v2.bank_name)).access_token}`,
                "Content-Type": "application/json",
                "env-id": req.headers['env-id'],
                "x-test-mode": req.headers['x-test-mode']
            },
            body: { ...req.body.payload }
        }
        const result = await lib.RequestFunction.post(true, endpoint.default.kbank[mode].inquiryOtherBankAC, obj.headers, obj.body)
        res.status(200).json(result.data)
    } catch (error) {
        console.error(`[${lib.c_time()}][${req.originalUrl}] Error => ${error}`)
        const send_res = {
            ResponseCode: "KTBERR02",
            message: error
        }
        res.status(500).json(send_res)
    }
})

API.post('/transferOtherBankAC', async (req, res) => {
    try {
        const obj = {
            headers: {
                "Authorization": `Bearer ${(await token_session.GET_RAW(req.body.unique_key, config_kbank_v2.bank_name)).access_token}`,
                "Content-Type": "application/json",
                "env-id": req.headers['env-id'],
                "x-test-mode": req.headers['x-test-mode']
            },
            body: { ...req.body.payload }
        }
        const result = await lib.RequestFunction.post(true, endpoint.default.kbank[mode].transferOtherBankAC, obj.headers, obj.body)
        res.status(200).json(result.data)
    } catch (error) {
        console.error(`[${lib.c_time()}][${req.originalUrl}] Error => ${error}`)
        const send_res = {
            ResponseCode: "KTBERR02",
            message: error
        }
    }
})

API.post('/test-ssl', oAuthV2, async (req, res) => {
    try {
        const obj = {
            headers: {
                "Authorization": `Bearer ${(await token_session.GET_RAW(req.body.unique_key, config_kbank_v2.bank_name)).access_token}`,
                "Content-Type": "application/json",
                //"x-test-mode": req.headers['x-test-mode']
            }
        }
        const result = await lib.RequestFunction.post(true, endpoint.default.kbank[mode].twoway_ssl, obj.headers)
        res.status(200).json(result.data)
    } catch (error) {
        console.error(`[${lib.c_time()}][${req.originalUrl}] Error => ${error}`)
        const send_res = {
            ResponseCode: "KBANKERR02",
            message: error
        }
        res.status(500).json(send_res)
    }
})

export default API