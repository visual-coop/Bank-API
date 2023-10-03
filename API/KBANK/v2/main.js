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

const mode = process.env.NODE_ENV

const oAuthV2 = async (req, res, next) => {
    const Credential = `${config_kbank_v2.credentials[mode].consumer_id}:${config_kbank_v2.credentials[mode].consumer_secret}`

    try {
        if (await token_session.GET(req.body.unique_key, config_kbank_v2.bank_name)) {
            console.log('session in =>', req.body.unique_key)
            const obj = {
                headers: {
                    "Authorization": `Basic ${KBANK.Base64Encoded(Credential)}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: {
                    "grant_type": "client_credentials"
                }
            }
            const result = await lib.RequestFunction.post(true, endpoint.default.kbank[mode].oAuthV2, obj.headers, obj.body, { ssl: KBANK.httpsAgent })
            await token_session.SET(req.body.unique_key, config_kbank_v2.bank_name, result.data)
        }
        next()
    } catch (error) {
        console.error(`[${lib.c_time()}][Authorization] Unauthorized => ${error}`)
        res.status(400).end(`[${lib.c_time()}][Authorization] Unauthorized => ${error}`)
    }
}

API.post('/verifydata', decodedJWT, oAuthV2, async (req, res) => {
    const { unique_key, coop_key, customerMobileNo } = req.body
    try {
        const payer = await DB_KBANK.GetPayerInfo(coop_key)
        const obj = {
            headers: {
                "Authorization": `Bearer ${(await token_session.GET_RAW(unique_key, config_kbank_v2.bank_name)).access_token}`,
                "Content-Type": "application/json",
            },
            body: {
                amount: req.body.amount,
                fromAccountNo: payer.payer_account,
                merchantID: payer.merchant_id,
                merchantTransID: `${payer.merchant_id}_${moment().format('YYYYMMDD')}_${req.body.ref_no}`,
                proxyType: "10",
                proxyValue: req.body.bank_account_no,
                requestDateTime: mode === 'dev' ? "2023-10-01T13:36:00.005+07:00" : moment().format('yyyy-MM-DDTHH:mm:ss:SSS+07:00'),
                senderName: mode === 'dev' ? 'AEROTHAI Saving' : req.body.senderName,
                senderTaxID: mode === 'dev' ? "1480200025231" : req.body.citizen_id,
                toBankCode: "004",
                transType: "K2K",
                typeOfSender: "K"
            }
        }
        const result = await lib.RequestFunction.post(true, endpoint.default.kbank[mode].verifyData, obj.headers, obj.body, { ssl: KBANK.httpsAgent })

        const verify_result = {
            ACCOUNT_NAME: result.data.toAccNameTH,
            ACCOUNT_NAME_EN: result.data.toAccNameEN,
            CUSTOMER_MOBILE_NO: customerMobileNo,
            REF_KBANK: result.data.merchantTransID,
            CITIZEN_ID_ENC: result.data.senderTaxID,
            BANK_ACCOUNT_ENC: result.data.proxyValue,
            TRAN_ID: result.data.rsTransID,
            RESULT: true
        }
        res.status(200).json(verify_result)
    } catch (error) {
        console.error(`[${lib.c_time()}][${req.originalUrl}] Error => ${error}`)
        const send_res = {
            ResponseCode: "KBANKERR02",
            message: error,
            RESULT: false
        }
        res.status(500).json(send_res)
    }
})

API.post('/fundtransfer', decodedJWT, async (req, res) => {
    const { exp, sigma_key, coop_key, amt_transfer, ...payload } = req.body
    const merchantID = payload.merchantTransID.match(/^([A-Z]+)_/)[1]
    try {
        if (await token_session.GET(req.body.sigma_key, config_kbank_v2.bank_name)) throw "Unauthorized"
        const obj = {
            headers: {
                "Authorization": `Bearer ${(await token_session.GET_RAW(req.body.sigma_key, config_kbank_v2.bank_name)).access_token}`,
                "Content-Type": "application/json",
            },
            body: {
                customerMobileNo: payload.customerMobileNo,
                merchantID: merchantID,
                merchantTransID: payload.merchantTransID,
                requestDateTime: mode === 'dev' ? "2022-01-01T13:36:00.005+07:00" : moment().format('yyyy-MM-DDTHH:mm:ss:SSS+07:00'),
                rsTransID: payload.rsTransID,
                ref1: "",
                ref2: ""
            }
        }

        const result = await lib.RequestFunction.post(true, endpoint.default.kbank[mode].fundTransfer, obj.headers, obj.body, { ssl: KBANK.httpsAgent })

        if (result.data.responseCode === '0000') {
            const payload_verify_result = {
                RESULT: true
            }

            const db_log_payload = {
                log_income: req.body,
                trans_flag: "-1",
                coop_key: coop_key,
                sigma_key: req.body.sigma_key,
                log_response: result.data
            }

            await DB_KBANK.ResultLog(db_log_payload)

            res.status(200).json(payload_verify_result)
        } else {
            obj.body = {
                merchantID: merchantID,
                merchantTransID: payload.merchantTransID,
                requestDateTime: mode === 'dev' ? "2022-01-01T13:36:00.005+07:00" : moment().format('yyyy-MM-DDTHH:mm:ss:SSS+07:00'),
                rsTransID: payload.rsTransID
            }

            const Txn_result = await lib.RequestFunction.post(true, endpoint.default.kbank[mode].inqueryTxnStatus, obj.headers, obj.body, { ssl: KBANK.httpsAgent })

            const payload_Txn_result = {
                RESPONSE_CODE: Txn_result.data.responseCode,
                RESPONSE_MESSAGE: Txn_result.data.responseMsg,
                RESULT: false
            }

            const db_log_payload = {
                log_income: req.body,
                trans_flag: "-1",
                coop_key: coop_key,
                sigma_key: req.body.sigma_key,
                log_response: Txn_result.data
            }

            await DB_KBANK.ResultLog(db_log_payload)

            res.status(200).json(payload_Txn_result)
        }

        console.log(`[${lib.c_time()}] Transfer =>`)
        console.log(result.data)

        //await token_session.DEL(req.body.unique_key,config_kbank_v2.bank_name)

    } catch (error) {
        console.error(`[${lib.c_time()}][${req.originalUrl}] Error => ${error}`)
        const send_res = {
            ResponseCode: "KTBERR02",
            message: error
        }
        if (error === 'Unauthorized') res.status(401).json(send_res)
        else res.status(400).json(send_res)
    }
})

API.post('/test-ssl', oAuthV2, async (req, res) => {
    try {
        const obj = {
            headers: {
                "Authorization": `Bearer ${(await token_session.GET_RAW(req.body.unique_key, config_kbank_v2.bank_name)).access_token}`,
                "Content-Type": "application/json",
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