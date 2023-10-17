import { RequestFunction, c_time, genGUID, checkCompleteArgument, gen_sigma_key, formatMysqlDate, pad_amt } from "#Utils/utility.func"
import { SessionManager } from "#Services/redis.service"
import { CIMBServices } from "#Services/banks.service"
import * as cimb from "#Utils/cimb.func"
import * as endpoint from "#constants/api_endpoint"

export class CIMBContoller {

    #mode = process.env.NODE_ENV
    #session = new SessionManager()
    #service = new CIMBServices()
    #bankNameInit = cimb.constants.bankNameInit.toUpperCase()

    inquiryAccountCIMB = async (req, res) => {
        const arg_keys = [
            'opay_encrypt_key64',
            'opay_encrypt_iv64',
            'destination',
            'amt_transfer',
            'trans_type',
            'bu_encode',
            'unique_id'
        ]
        if (checkCompleteArgument(arg_keys, req.body)) {
            try {
                const aesKey = cimb.generateAESKey()
                const aesIV = cimb.getIV(aesKey)
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
                        request_id: `${genGUID()}`,
                        message: cimb.RSApublicEncrypt(public_key_RSA, messageStr),
                        Authorization: `Bearer ${await this.#session.getAuth(req.body.unique_id, this.#bankNameInit)}`
                    },
                    body: {
                        data: cimb.AESencrypt(aesKey, aesIV, JSON.stringify(cimb.buildOPAYRequest(opay_payload)))
                    }
                }

                const InquiryResult = await RequestFunction.post(true, endpoint.default.cimb[this.#mode].inquiryAccountV2CIMB, obj.headers, obj.body, {})

                const Decrypted = cimb.AESdecrypt(aesKey, aesIV, InquiryResult.data.data)

                const jsonResponse = JSON.parse(Decrypted.toString())

                const result = JSON.parse(cimb.BodyDecrypt(req.body.opay_encrypt_key64, req.body.opay_encrypt_iv64, jsonResponse.data))

                if (result === undefined) throw "Decypt error"

                if (result.ResponseCode === '00') {
                    const result_payload = {
                        RESULT: true,
                        ...result
                    }
                    res.status(200).json(result_payload)
                } else {
                    console.log(`[${c_time()}][Inquiry] Failed , CilentTransNo : ${result?.ClientTransactionNo} => ${result?.Description}`)
                    const result_payload = {
                        RESULT: false,
                        ...result
                    }
                    res.status(200).json(result_payload)
                }
            } catch (error) {
                console.error(`[${c_time()}][Inquiry] Error => ${error}`)
                const send_res = {
                    ResponseCode: "CIMBERR02",
                    message: error,
                    RESULT: false
                }
                res.status(400).json(send_res)
            }
        } else {
            console.error(`[${c_time()}][Inquiry] Error => Payload not compalte`)
            const send_res = {
                ResponseCode: "CIMBERR01",
                message: "Payload not compalte",
                RESULT: false
            }
            res.status(400).json(send_res)
        }
    }

    confirmFunsTransferCIMB = async (req, res) => {
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
        if (checkCompleteArgument(arg_keys, req.body) && !!req.route.path) {
            try {
                const constantsInit = await this.#service.constantsInit(req.body.coop_key,this.#bankNameInit)
                req.body = {
                    ...constantsInit,
                    ...req.body
                }
                const aesKey = cimb.generateAESKey()
                const aesIV = cimb.getIV(aesKey)
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
                        request_id: `${genGUID()}`,
                        message: cimb.RSApublicEncrypt(public_key_RSA, messageStr),
                        Authorization: `Bearer ${await this.#session.getAuth(req.body.unique_id, this.#bankNameInit)}`
                    },
                    body: {
                        data: cimb.AESencrypt(aesKey, aesIV, JSON.stringify(cimb.buildOPAYRequest(opay_payload)))
                    }
                }

                const ConfirmResult = await RequestFunction.post(true, endpoint.default.cimb[this.#mode].confirmFunsTransferV2CIMB, obj.headers, obj.body, {})

                const Decrypted = cimb.AESdecrypt(aesKey, aesIV, ConfirmResult.data.data)

                const jsonResponse = JSON.parse(Decrypted.toString())

                let result = JSON.parse(cimb.BodyDecrypt(req.body.opay_encrypt_key64, req.body.opay_encrypt_iv64, jsonResponse.data))

                if (result === undefined) throw "Decypt error"

                if (result.ResponseCode === '00') {

                    const transaction_uuid = gen_sigma_key()

                    const log_in_payload = {
                        // exp: 1627534828,
                        coop_key: req.body.coop_key,
                        ref_trans: {
                            ClientTransactionNo: req.body.ClientTransactionNo
                        },
                        tran_date: formatMysqlDate(new Date()),
                        // citizen_id: null,
                        amt_transfer: pad_amt(req.body.amt_transfer),
                        trans_type: req.body.trans_type,
                        bank_account: req.body.destination,
                        operate_date: `${formatMysqlDate(new Date())}+07.00`,
                        // coop_account_no: "000130002821"
                    }

                    const log_payload = {
                        log_income: log_in_payload,
                        trans_flag: '-1',
                        coop_key: req.body.coop_key,
                        sigma_key: transaction_uuid,
                        log_response: result
                    }

                    await this.#service.transLog(log_payload)

                    await this.#session.endSession(req.body.unique_id,this.#bankNameInit)

                    const result_payload = {
                        RESULT: true,
                        sigma_key: transaction_uuid,
                        ...result
                    }
                    res.status(200).json(result_payload)
                } else {
                    console.log(`[${c_time()}][Inquiry] Failed , CilentTransNo : ${result?.ClientTransactionNo} => ${result?.Description}`)
                    const result_payload = {
                        RESULT: false,
                        ...result
                    }
                    res.status(200).json(result_payload)
                }

            } catch (error) {
                console.error(`[${c_time()}][Confirm] Error => ${error}`)
                const send_res = {
                    ResponseCode: "CIMBERR02",
                    message: error,
                    RESULT: false
                }
                res.status(400).json(send_res)
            }
        } else {
            console.error(`[${c_time()}][Confirm] Error => Payload not compalte`)
            const send_res = {
                ResponseCode: "CIMBERR01",
                message: "Payload not compalte",
                RESULT: false
            }
            res.status(400).json(send_res)
        }
    }

    getStatusV2CIMB = async (req,res) => {
        const arg_keys = [
            'opay_encrypt_key64',
            'opay_encrypt_iv64',
            'ClientTransactionNo',
            'TransactionID',
            'bu_encode'
        ]
        if (checkCompleteArgument(arg_keys, req.body) && !!req.route.path) {
            try {
                const constantsInit = await this.#service.constantsInit(req.body.coop_key,this.#bankNameInit)
                req.body = {
                    ...constantsInit,
                    ...req.body
                }
                const aesKey = cimb.generateAESKey()
                const aesIV = cimb.getIV(aesKey)
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
                        request_id: `${genGUID()}`,
                        message: cimb.RSApublicEncrypt(public_key_RSA, messageStr),
                        Authorization: `Bearer ${await this.#session.getAuth(req.body.unique_id, this.#bankNameInit)}`
                    },
                    body: {
                        data: cimb.AESencrypt(aesKey, aesIV, JSON.stringify(cimb.buildOPAYRequest(opay_payload)))
                    }
                }
    
                const ConfirmResult = await RequestFunction.post(true, endpoint.default.cimb[this.#mode].getStatusV2CIMB, obj.headers, obj.body)
    
                const Decrypted = cimb.AESdecrypt(aesKey, aesIV, ConfirmResult.data.data)
    
                const jsonResponse = JSON.parse(Decrypted.toString())
    
                const result = cimb.BodyDecrypt(req.body.opay_encrypt_key64, req.body.opay_encrypt_iv64, jsonResponse.data)
    
                if (result) {
                    res.status(200).json(JSON.parse(result))
                } else {
                    throw "Decypt error"
                }
    
            } catch (error) {
                console.error(`[${c_time()}][Get status] Error => ${error}`)
                const send_res = {
                    ResponseCode: "CIMBERR02",
                    message: error
                }
                res.status(500).json(send_res)
            }
        } else {
            console.error(`[${c_time()}][Get status] Error => Payload not compalte`)
            const send_res = {
                ResponseCode: "CIMBERR01",
                message: "Payload not compalte"
            }
            res.status(500).json(send_res)
        }
    }
}