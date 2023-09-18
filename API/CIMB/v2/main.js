import express from 'express'
import * as CIMB from '#libs/Functions_CIMB'
import * as lib from '#libs/Functions'
import { config_cimb_v2 } from '#API/CIMB/config'
import { get_init_config, CIMB_TOKEN } from '#cache/redis'
import { GATEWAY_DB_CIMB } from '#db/query'

const router = express.Router()
router.use(express.json())
router.use(express.urlencoded({
    extended: true,
    defer: true
}))

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
        'client_ref_id',
        'secret_key',
        'x_apigw_api_id',
        'unique_id'
    ]
    if (lib.checkCompleteArgument(arg_keys, req.body)) {
        try {
            if ((await CIMB_TOKEN.GET(req.body.unique_id) && req.route.path == '/inquiryAccountCIMB') || req.route.path == '/getStatusV2CIMB') {
                const aesKey = CIMB.generateAESKey()
                const aesIV = CIMB.getIV(aesKey)
                const epoch = Math.floor(new Date().getTime() / 1000)
                const messageStr = aesKey + "|" + epoch
                const body = "{\"secret_key\": \"" + req.body.secret_key + "\",\"grant_type\": \"client_credentials\"}"
                const public_key = '-----BEGIN PUBLIC KEY-----\n' + req.body.public_key + '-----END PUBLIC KEY-----'
                const obj = {
                    headers: {
                        client_id: req.body.client_id,
                        client_ref_id: req.body.client_ref_id,
                        "x-apigw-api-id": req.body.x_apigw_api_id,
                        request_id: `${lib.genGUID()}`,
                        message: CIMB.RSApublicEncrypt(public_key, messageStr),
                    },
                    body: {
                        data: CIMB.AESencrypt(aesKey, aesIV, body)
                    }
                }

                const Encrypted = await lib.RequestFunction.post(false, req.bank_api_path.oAuthTokenV2CIMB, obj.headers, obj.body)

                const Decrypted = CIMB.AESdecrypt(aesKey, aesIV, Encrypted.data.data)

                const jsonResponse = JSON.parse(Decrypted.toString())

                if (req.route.path !== '/getStatusV2CIMB') await CIMB_TOKEN.SET(req.body.unique_id, jsonResponse)
                
            }
            req.body.routePath = req.route.path
            next()
        } catch (error) {
            console.error(`[${lib.c_time()}][Authorization] Error => ${error}`)
            res.status(500).end(`[${lib.c_time()}][Authorization] Error => ${error}`)
        }
    } else {
        console.error(`[${lib.c_time()}][Authorization] Error => Payload not compalte`)
        res.status(500).end(`[${lib.c_time()}][Authorization] Error => Payload not compalte`)
    }
}

router.post('/inquiryAccountCIMB', oAuthTokenV2CIMB, async (req, res) => {
    const arg_keys = [
        'opay_encrypt_key64',
        'opay_encrypt_iv64',
        'destination',
        'amt_transfer',
        'trans_type',
        'bu_encode',
        'unique_id'
    ]
    if (lib.checkCompleteArgument(arg_keys, req.body)) {
        try {
            const aesKey = CIMB.generateAESKey()
            const aesIV = CIMB.getIV(aesKey)
            const epoch = Math.floor(new Date().getTime() / 1000)
            const messageStr = aesKey + "|" + epoch
            const public_key_RSA = '-----BEGIN PUBLIC KEY-----\n' + req.body.public_key + '-----END PUBLIC KEY-----'
            const { public_key, client_ref_id, client_id, channel_id, coop_key, secret_key, x_apigw_api_id, unique_id, ...opay_payload } = req.body
            const obj = {
                headers: {
                    "Content-Type": "application/json",
                    client_id: req.body.client_id,
                    client_ref_id: req.body.client_ref_id,
                    "x-apigw-api-id": req.body.x_apigw_api_id,
                    request_id: `${lib.genGUID()}`,
                    message: CIMB.RSApublicEncrypt(public_key_RSA, messageStr),
                    Authorization: `Bearer ${await CIMB_TOKEN.GET_AUTH(req.body.unique_id)}`
                },
                body: {
                    data: CIMB.AESencrypt(aesKey, aesIV, JSON.stringify(CIMB.buildOPAYRequest(opay_payload)))
                }
            }

            const InquiryResult = await lib.RequestFunction.post(true, req.bank_api_path.inquiryAccountV2CIMB, obj.headers, obj.body)

            const Decrypted = CIMB.AESdecrypt(aesKey, aesIV, InquiryResult.data.data)

            const jsonResponse = JSON.parse(Decrypted.toString())

            const result = CIMB.BodyDecrypt(req.body.opay_encrypt_key64, req.body.opay_encrypt_iv64, jsonResponse.data)

            if (result === undefined) {
                throw "Decypt error"
            }
            else res.status(200).json(JSON.parse(result))
        } catch (error) {
            console.error(`[${lib.c_time()}][Inquiry] Error => ${error}`)
            const send_res = {
                ResponseCode: "CIMBERR02",
                message: error 
            }
            res.status(500).json(send_res)
        }
    } else {
        console.error(`[${lib.c_time()}][Inquiry] Error => Payload not compalte`)
        const send_res = {
            ResponseCode: "CIMBERR01",
            message: "Payload not compalte"
        }
        res.status(500).json(send_res)
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
        'bu_encode',
        'unique_id'
    ]
    if (lib.checkCompleteArgument(arg_keys, req.body) && !!req.route.path) {
        try {
            const aesKey = CIMB.generateAESKey()
            const aesIV = CIMB.getIV(aesKey)
            const epoch = Math.floor(new Date().getTime() / 1000)
            const messageStr = aesKey + "|" + epoch
            const public_key_RSA = '-----BEGIN PUBLIC KEY-----\n' + req.body.public_key + '-----END PUBLIC KEY-----'
            const { public_key, client_ref_id, client_id, channel_id, coop_key, secret_key, x_apigw_api_id, unique_id, ...opay_payload } = req.body
            const obj = {
                headers: {
                    "Content-Type": "application/json",
                    client_id: req.body.client_id,
                    client_ref_id: req.body.client_ref_id,
                    "x-apigw-api-id": req.body.x_apigw_api_id,
                    request_id: `${lib.genGUID()}`,
                    message: CIMB.RSApublicEncrypt(public_key_RSA, messageStr),
                    Authorization: `Bearer ${await CIMB_TOKEN.GET_AUTH(req.body.unique_id)}`
                },
                body: {
                    data: CIMB.AESencrypt(aesKey, aesIV, JSON.stringify(CIMB.buildOPAYRequest(opay_payload)))
                }
            }

            const ConfirmResult = await lib.RequestFunction.post(true, req.bank_api_path.confirmFunsTransferV2CIMB, obj.headers, obj.body)

            const Decrypted = CIMB.AESdecrypt(aesKey, aesIV, ConfirmResult.data.data)

            const jsonResponse = JSON.parse(Decrypted.toString())

            let result = CIMB.BodyDecrypt(req.body.opay_encrypt_key64, req.body.opay_encrypt_iv64, jsonResponse.data)

            if (result) {

                const transaction_uuid = lib.gen_sigma_key()

                const log_in_payload = {
                    // exp: 1627534828,
                    coop_key : req.body.coop_key,
                    ref_trans : {
                        ClientTransactionNo: req.body.ClientTransactionNo
                    },
                    tran_date : lib.formatMysqlDate(new Date()),
                    // citizen_id: null,
                    amt_transfer : lib.pad_amt(req.body.amt_transfer),
                    trans_type : req.body.trans_type,
                    bank_account : req.body.destination,
                    operate_date : `${lib.formatMysqlDate(new Date())}+07.00`,
                    // coop_account_no: "000130002821"
                }

                const log_payload = {
                    log_income: log_in_payload,
                    trans_flag: '-1',
                    coop_key: req.body.coop_key,
                    sigma_key: transaction_uuid,
                    log_response: JSON.parse(result)
                }

                await GATEWAY_DB_CIMB.SET_LOG(log_payload)
                    .then(() => {
                        console.log(`[${lib.c_time()}][Transaction log] Insert sucessfully => ${req.body.ClientTransactionNo}`)
                    })
                    .catch((error) => {
                        console.error(`[${lib.c_time()}][Transaction log] Insert error => ${error}`)
                    })

                await CIMB_TOKEN.DEL(req.body.unique_id)
                result = JSON.parse(result)
                const res_payload = {
                    ...result,
                    sigma_key : transaction_uuid
                }
                res.status(200).json(res_payload)
            } else {
                throw "Decypt error"
            }
        } catch (error) {
            console.error(`[${lib.c_time()}][Confirm] Error => ${error}`)
            const send_res = {
                ResponseCode: "CIMBERR02",
                message: error
            }
            res.status(500).json(send_res)
        }
    } else {
        console.error(`[${lib.c_time()}][Confirm] Error => Payload not compalte`)
        const send_res = {
            ResponseCode: "CIMBERR01",
            message: "Payload not compalte"
        }
        res.status(500).json(send_res)
    }
})

router.post('/getStatusV2CIMB', oAuthTokenV2CIMB, async (req, res) => {
    const arg_keys = [
        'opay_encrypt_key64',
        'opay_encrypt_iv64',
        'ClientTransactionNo',
        'TransactionID',
        'bu_encode'
    ]
    if (lib.checkCompleteArgument(arg_keys, req.body) && !!req.route.path) {
        try {
            const aesKey = CIMB.generateAESKey()
            const aesIV = CIMB.getIV(aesKey)
            const epoch = Math.floor(new Date().getTime() / 1000)
            const messageStr = aesKey + "|" + epoch
            const public_key_RSA = '-----BEGIN PUBLIC KEY-----\n' + req.body.public_key + '-----END PUBLIC KEY-----'
            const { public_key, client_ref_id, client_id, channel_id, coop_key, secret_key, x_apigw_api_id, unique_id, ...opay_payload } = req.body
            const obj = {
                headers: {
                    "Content-Type": "application/json",
                    client_id: req.body.client_id,
                    client_ref_id: req.body.client_ref_id,
                    "x-apigw-api-id": req.body.x_apigw_api_id,
                    request_id: `${lib.genGUID()}`,
                    message: CIMB.RSApublicEncrypt(public_key_RSA, messageStr),
                    Authorization: `Bearer ${await CIMB_TOKEN.GET_AUTH(req.body.unique_id)}`
                },
                body: {
                    data: CIMB.AESencrypt(aesKey, aesIV, JSON.stringify(CIMB.buildOPAYRequest(opay_payload)))
                }
            }

            const ConfirmResult = await lib.RequestFunction.post(true, req.bank_api_path.getStatusV2CIMB_, obj.headers, obj.body)

            const Decrypted = CIMB.AESdecrypt(aesKey, aesIV, ConfirmResult.data.data)

            const jsonResponse = JSON.parse(Decrypted.toString())

            const result = CIMB.BodyDecrypt(req.body.opay_encrypt_key64, req.body.opay_encrypt_iv64, jsonResponse.data)

            if (result) {
                res.status(200).json(JSON.parse(result))
            } else {
                throw "Decypt error"
            }

        } catch (error) {
            console.error(`[${lib.c_time()}][Get status] Error => ${error}`)
            const send_res = {
                ResponseCode: "CIMBERR02",
                message: error
            }
            res.status(500).json(send_res)
        }
    } else {
        console.error(`[${lib.c_time()}][Get status] Error => Payload not compalte`)
        const send_res = {
            ResponseCode: "CIMBERR01",
            message: "Payload not compalte"
        }
        res.status(500).json(send_res)
    }
})

export default router