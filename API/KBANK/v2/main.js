import express from 'express'
import configs from '#constants/configs'
import * as KBANK from "#API/KBANK/v2/function"
import * as lib from '#libs/Functions'
import { config_kbank_v2 } from "#API/KBANK/config"
import * as endpoint from '#constants/api_endpoint'
import { token_session } from '#cache/redis'
import { GATEWAY_DB } from '#db/query'

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
        if (await token_session.GET(req.body.unique_key,config_kbank_v2.bank_name)) {
            console.log('session in =>' , req.body.unique_key)
            const obj = {
                headers: {
                    "Authorization": `Basic ${KBANK.Base64Encoded(Credential)}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "env-id": "OAUTH2",
                    "x-test-mode": "true"
                },
                body: {
                    "grant_type": "client_credentials"
                }
            }
            
            const result = await lib.RequestFunction.post(true, endpoint.default.kbank[mode].oAuthV2, obj.headers, obj.body)
            console.log(result)
            await token_session.SET(req.body.unique_key,config_kbank_v2.bank_name,result.data)
        }
        next()
    } catch (error) {
        console.error(`[${lib.c_time()}][Authorization] Unauthorized => ${error}`)
        res.status(500).end(`[${lib.c_time()}][Authorization] Unauthorized => ${error}`)
    }
}

API.post('/test-ssl' , oAuthV2 , async (req,res) => {
    try {
        const obj = {
            headers : {
                "Authorization": `Bearer ${(await token_session.GET_RAW(req.body.unique_key,config_kbank_v2.bank_name)).access_token}`,
                "Content-Type": "application/json",
                //"x-test-mode": req.headers['x-test-mode']
            }
        }
        const result = await lib.RequestFunction.post(true,endpoint.default.kbank[mode].twoway_ssl,obj.headers)
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

API.post('/inquiryAC', oAuthV2, async (req, res) => {
    try {
        const obj = {
            headers: {
                "Authorization": `Bearer ${(await token_session.GET_RAW(req.body.unique_key,config_kbank_v2.bank_name)).access_token}`,
                "Content-Type": "application/json",
                "env-id": req.headers['env-id'],
                "x-test-mode": req.headers['x-test-mode']
            },
            body: { ...req.body.payload }
        }
        const result = await lib.RequestFunction.post(true, endpoint.default.kbank[mode].inquiryAC, obj.headers, obj.body)
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

API.post('/transferAC', oAuthV2, async (req, res) => {
    try {
        const obj = {
            headers: {
                "Authorization": `Bearer ${(await token_session.GET_RAW(req.body.unique_key,config_kbank_v2.bank_name)).access_token}`,
                "Content-Type": "application/json",
                "env-id": req.headers['env-id'],
                "x-test-mode": req.headers['x-test-mode']
            },
            body: { ...req.body.payload }
        } //moment().format('yyyy-MM-DDTHH:mm:ss:SSS+07:00'),
        const result = await lib.RequestFunction.post(true,endpoint.default.kbank[mode].tranferAC,obj.headers,obj.body)

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

API.post('/inquiryOtherBankAC' , oAuthV2 , async (req,res) => {
    
    try {
        
        //await GATEWAY_DB.GET_PAYER_KBANK()
        const obj = {
            headers: {
                "Authorization": `Bearer ${(await token_session.GET_RAW(req.body.unique_key,config_kbank_v2.bank_name)).access_token}`,
                "Content-Type": "application/json",
                "env-id": req.headers['env-id'],
                "x-test-mode": req.headers['x-test-mode']
            },
            body: { ...req.body.payload }
        }
        const result = await lib.RequestFunction.post(true,endpoint.default.kbank[mode].inquiryOtherBankAC,obj.headers,obj.body)
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

API.post('/transferOtherBankAC' , async (req,res) => {
    try {
        const obj = {
            headers: {
                "Authorization": `Bearer ${(await token_session.GET_RAW(req.body.unique_key,config_kbank_v2.bank_name)).access_token}`,
                "Content-Type": "application/json",
                "env-id": req.headers['env-id'],
                "x-test-mode": req.headers['x-test-mode']
            },
            body: { ...req.body.payload }
        }
        const result = await lib.RequestFunction.post(true,endpoint.default.kbank[mode].transferOtherBankAC,obj.headers,obj.body)
        res.status(200).json(result.data)
    } catch (error) {
        console.error(`[${lib.c_time()}][${req.originalUrl}] Error => ${error}`)
        const send_res = {
            ResponseCode: "KTBERR02",
            message: error
        }
    }
})

export default API