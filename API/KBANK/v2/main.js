import express from 'express'
import configs from '#constants/configs'
import moment from 'moment'
import * as KBANK from "#API/KBANK/v2/function"
import * as lib from '#libs/Functions'
import { config_kbank_v2 } from "#API/KBANK/config"
import * as endpoint from '#constants/api_endpoint'

const API = express.Router()
API.use(express.json())
API.use(express.urlencoded({
    extended: true,
    defer: true
}))

const oAuthV2 = async (req, res, next) => {
    //console.log(moment().format('yyyy-MM-DDTHH:mm:ss:SSS+07:00'))
    // 2022-01-01T13:36:00.005+07:00
    // 2023-09-27T11:40: 28: 095+07:00
    const Credential = `${config_kbank_v2.credentials.consumer_id}:${config_kbank_v2.credentials.consumer_secret}`

    try {
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
        const result = await lib.RequestFunction.post(true, endpoint.default.kbank.oAuthV2, obj.headers, obj.body)
        req.oAuth = result.data
        next()
    } catch (error) {
        console.error(`[${lib.c_time()}][Authorization] Error => ${error}`)
        res.status(500).end(`[${lib.c_time()}][Authorization] Error => ${error}`)
    }

}

API.post('/inquiryAC', oAuthV2, async (req, res) => {
    try {
        const obj = {
            headers: {
                "Authorization": `Bearer ${req.oAuth.access_token}`,
                "Content-Type": "application/json",
                "env-id": "CFT001",
                "x-test-mode": "true"
            },
            body: {
                "amount": "2000.99",
                "fromAccountNo": "1112333000",
                "merchantID": "1005",
                "merchantTransID": "1005_20220101_0000000000000000000000101",
                "proxyType": "10",
                "proxyValue": "0118324366",
                "requestDateTime": "2022-01-01T13:36:00.005+07:00",
                "senderName": "Sompong",
                "senderTaxID": "0001301120098",
                "toBankCode": "004",
                "transType": "K2K",
                "typeOfSender": "K"
            }
        }

        
        const result = await lib.RequestFunction.post(true, endpoint.default.kbank.inquiryAC, obj.headers, obj.body)
        res.status(200).json(result.data)
    } catch (error) {
        console.error(`[${lib.c_time()}][Inquiry] Error => ${error}`)
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
                "Authorization": `Bearer ${req.oAuth.access_token}`,
                "Content-Type": "application/json",
                "env-id": "CFT002",
                "x-test-mode": "true"
            },
            body: {
                "customerMobileNo": "0991115588",
                "merchantID": "1005",
                "merchantTransID": req.body.merchantTransID,
                "ref1": "",
                "ref2": "",
                "requestDateTime": "2022-01-01T13:36:00.005+07:00", //moment().format('yyyy-MM-DDTHH:mm:ss:SSS+07:00'),
                "rsTransID": req.body.rsTransID
            }
        }
        console.log(obj)
        const result = await lib.RequestFunction.post(true,endpoint.default.kbank.tranferAC,obj.headers,obj.body)
        res.status(200).json(result.data)
    } catch (error) {
        console.error(`[${lib.c_time()}][Confirm] Error => ${error}`)
        const send_res = {
            ResponseCode: "KTBERR02",
            message: error
        }
        res.status(500).json(send_res)
    }
})

export default API