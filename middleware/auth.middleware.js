import { RequestFunction , genGUID, checkCompleteArgument } from "#Utils/utility.func"
import { SessionManager } from "#Services/redis.service"
import { CIMBServices } from "#Services/banks.service"
import { HttpException } from "#Exceptions/HttpException"
import * as kbank from "#Utils/kbank.func"
import * as cimb from "#Utils/cimb.func"
import * as ainu from "#Utils/ainu.func"
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
        next(new HttpException(401, `Authentication token error ${error}`))
    }
}

export const oAuthV2CIMB = async (req, res, next) => {
    const bankNameInit = cimb.constants.bankNameInit.toUpperCase()
    try {
        const constantsInit = await new CIMBServices().constantsInit(req.body.coop_key,bankNameInit)
        req.body = {
            ...constantsInit,
            ...req.body
        }
    } catch (error) {
        next(new HttpException(401, `Authentication token error ${error}`))
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
            next(new HttpException(401, `Authentication token error ${error}`))
        }
    } else {
        next(new HttpException(400, `Payload not complete`))
    }
}

export const ainuAuth = async (req, res, next) => {
    try {
        const obj = {
            headers : {
                'Content-type' : 'application/json'
            },
            body : {
                'grantType' : 'client_credentials',
                'accountId' : ainu.constants.credentials[mode].accountId,
                'accountSecret' : ainu.constants.credentials[mode].accountSecret
            }
        }
        const url = endpoint.default.ainu[mode] + endpoint.default.ainu.endpoint.authorization
        req.headers.Authorization = 'Bearer ' + (await RequestFunction.post(false, url, obj.headers, obj.body , {})).data.accessToken
        next()
    } catch (error) {
        next(new HttpException(401, `Authentication token error ${error}`))
    }
}
