import { RequestFunction , c_time, genGUID, checkCompleteArgument } from "#Utils/utility.func"
import { SessionManager } from "#Services/redis.service"
import { CIMBServices } from "#Services/banks.service"
import * as kbank from "#Utils/kbank.func"
import * as cimb from "#Utils/cimb.func"
import * as endpoint from "#constants/endpoints"

const mode = process.env.NODE_ENV
const session = new SessionManager()

export const oAuthV2KBNAK = async (req, res, next) => {
    const bankNameInit = kbank.constants.bankNameInit.toUpperCase()
    const credential = `${kbank.constants.credentials[mode].consumer_id}:${kbank.constants.credentials[mode].consumer_secret}`

    try {
        if (await session.getStatus(req.body.unique_key, bankNameInit)) {
            const obj = {
                headers: {
                    "Authorization": `Basic ${kbank.Base64Encoded(credential)}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: {
                    "grant_type": "client_credentials"
                }
            }
            const result = await RequestFunction.post(true, endpoint.default.kbank[mode].oAuthV2, obj.headers, obj.body, { ssl: kbank.httpsAgent })
            await session.set(req.body.unique_key, bankNameInit, result.data)
        }
        next()
    } catch (error) {
        console.error(`[${c_time()}][Authorization] Unauthorized => ${error}`)
        res.status(400).end(`[${c_time()}][Authorization] Unauthorized => ${error}`)
    }
}

export const oAuthV2CIMB = async (req, res, next) => {
    const bankNameInit = cimb.constants.bankNameInit.toUpperCase()
    try {
        const constantsInit = await new CIMBServices().constantsInit(bankNameInit)
        req.body = {
            ...constantsInit,
            ...req.body
        }
    } catch (error) {
        console.error(`[${c_time()}][Authorization] Error => ${error}`)
        res.status(500).end(`[${c_time()}][Authorization] Error => ${error}`)
    }
    const arg_keys = [
        'public_key',
        'client_id',
        'client_ref_id',
        'secret_key',
        'x_apigw_api_id',
        'unique_id'
    ]
    if (checkCompleteArgument(arg_keys, req.body)) {
        try {
            if ((await session.getStatus(req.body.unique_id,bankNameInit) && req.body.routePath == '/inquiryAccountCIMB') || req.body.routePath == '/getStatusV2CIMB') {
                const aesKey = cimb.generateAESKey()
                const aesIV = cimb.getIV(aesKey)
                const epoch = Math.floor(new Date().getTime() / 1000)
                const messageStr = aesKey + "|" + epoch
                const body = "{\"secret_key\": \"" + req.body.secret_key + "\",\"grant_type\": \"client_credentials\"}"
                const public_key = '-----BEGIN PUBLIC KEY-----\n' + req.body.public_key + '-----END PUBLIC KEY-----'
                const obj = {
                    headers: {
                        client_id: req.body.client_id,
                        client_ref_id: req.body.client_ref_id,
                        "x-apigw-api-id": req.body.x_apigw_api_id,
                        request_id: `${genGUID()}`,
                        message: cimb.RSApublicEncrypt(public_key, messageStr),
                    },
                    body: {
                        data: cimb.AESencrypt(aesKey, aesIV, body)
                    }
                }
                
                const Encrypted = await RequestFunction.post(false, endpoint.default.cimb[mode].oAuthTokenV2CIMB, obj.headers, obj.body , {})

                const Decrypted = cimb.AESdecrypt(aesKey, aesIV, Encrypted.data.data)

                const jsonResponse = JSON.parse(Decrypted.toString())

                if (req.body.routePath !== '/getStatusV2CIMB') await session.set(req.body.unique_id, bankNameInit , jsonResponse , 800)
            }
            next()
        } catch (error) {
            console.error(`[${c_time()}][Authorization] Error => ${error}`)
            res.status(401).end(`[${c_time()}][Authorization] Error => ${error}`)
        }
    } else {
        console.error(`[${c_time()}][Authorization] Error => Payload not compalte`)
        res.status(401).end(`[${c_time()}][Authorization] Error => Payload not compalte`)
    }
}

