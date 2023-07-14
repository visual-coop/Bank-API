import forge from 'node-forge'
import CryptoJS from 'crypto-js'
import axios from 'axios'
import moment from 'moment'
import { PrismaClient, e_trans_flag } from '@prisma/client'
import { v4 as uuid } from 'uuid'

// ===== Encrypt Decrypt Algorithm =====

export const generateAESKey = () => {
    const length = 32
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let result = ''
    for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)]
    return result
}

export const getIV = (str) => {
    return str.substr(0, 16)
}

export const genGUID = () => {
    return uuid()
}

export const getMessageSecretKey = (messageDecrypt) => {
    let result = {
        aesKey: "",
        aesIV: "",
        epoch: ""
    }
    const messageArr = messageDecrypt.split("|")
    if (messageArr.length >= 2) {
        result.aesKey = messageArr[0]
        result.aesIV = getIV(messageArr[0])
        result.epoch = messageArr[1]
        return result
    } else {
        throw "Invalid message secret"
    }
}

export const RSApublicEncrypt = (publicKey, message) => {
    try {
        const rsa = forge.pki.publicKeyFromPem(publicKey)
        let encrypted = rsa.encrypt(message, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: {
                md: forge.md.sha256.create()
            }
        });
        return forge.util.encode64(encrypted)
    } catch (e) {
        throw e
    }
}

export const AESencrypt = (key, iv, text) => {
    try {
        const cipher = CryptoJS.AES.encrypt(text, CryptoJS.enc.Utf8.parse(key), {
            iv: CryptoJS.enc.Utf8.parse(iv),
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        })
        return cipher.toString()
    } catch (e) {
        throw e
    }
}

export const AESdecrypt = (key, iv, cipher) => {
    try {
        const bytes = CryptoJS.AES.decrypt(cipher, CryptoJS.enc.Utf8.parse(key), {
            iv: CryptoJS.enc.Utf8.parse(iv),
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        })
        return bytes.toString(CryptoJS.enc.Utf8)
    } catch (e) {
        throw e
    }
}

export const BodyDecrypt = (key64, iv64, body) => {
    const mgate_key64 = CryptoJS.enc.Base64.parse(key64)
    const mgate_iv64 = CryptoJS.enc.Base64.parse(iv64)
    try {
        let decrypted_myjson = CryptoJS.AES.decrypt(
            body,
            mgate_key64,
            {
                iv: mgate_iv64,
                padding: CryptoJS.pad.Pkcs7,
                mode: CryptoJS.mode.CBC
            }
        )
        return decrypted_myjson.toString(CryptoJS.enc.Utf8)
    } catch (e) {
        console.error("internal service decrypt error: ", e.message)
    }
}


export const buildOPAYRequest = (body) => {
    try {

        if (!!!body) throw "Payload not complate"

        const transaction_timestance = moment().format("YYYYMMDDHHmmssSSS")
        const mgate_key64 = CryptoJS.enc.Base64.parse(body.opay_encrypt_key64)
        const mgate_iv64 = CryptoJS.enc.Base64.parse(body.opay_encrypt_iv64)
        const words = CryptoJS.enc.Utf8.parse(body.channel_id)
        const mgate_channel = CryptoJS.enc.Base64.stringify(words)

        let ProxyType = body.trans_type, ToBankID = ''

        if (!body.trans_type) ProxyType = 'NATID'
        if (body.trans_type === 'ACCNO') ToBankID = body.bank_id

        let ClientTransactionNo
        if (body.routePath === '/getStatusV2CIMB' || body.routePath === '/confirmFunsTransferCIMB') ClientTransactionNo = body.ClientTransactionNo
        else ClientTransactionNo = `CORP${transaction_timestance}`

        let myjson = {
            "ClientTransactionNo": `${ClientTransactionNo}`,
            "ClientTransactionTimestamp": transaction_timestance,
            "ProxyType": ProxyType,
            "ProxyID": body.destination,
            "ToBankID": ToBankID,
            "BeneficiaryName": "Piti Chujai",
            "Amount": body.amt_transfer,
            "SenderName": "Mr. GANG WANG",
            "SenderID": body.card_person,
            "SenderAddress": "TH|67-6 ro",
            "SenderDateOfBirth": "20000705",
            "SenderPlaceOfBirth": "Test Place",
            "SenderReference": "TX0000589672",
            "SenderIDOther": "M35772699",
            "AdditionalInfo": {
                "SenderInfo": {
                    "SenderIDType": "NIDN",
                    "BirthPlace": "TH",
                    "CountryCd": "TH",
                    "ProvinceCd": "Bangkok"
                }
            }
        }

        if (body.routePath === '/getStatusV2CIMB') {
            myjson = {
                "TransactionID": body.TransactionID,
                "ClientTransactionNo": ClientTransactionNo,
                "ClientTransactionTimestamp": transaction_timestance,
            }
        }

        const encrypted_myjson = CryptoJS.AES.encrypt(
            JSON.stringify(myjson),
            mgate_key64,
            {
                iv: mgate_iv64,
                padding: CryptoJS.pad.Pkcs7,
                mode: CryptoJS.mode.CBC
            }
        )

        const payload = {
            data: `${mgate_channel}:${CryptoJS.enc.Base64.stringify(encrypted_myjson.ciphertext)}`
        }

        return JSON.stringify(payload)

    } catch (err) {
        console.log(`buildOPAYRequest error =>`, err)
    }
}

// ===== Request API =====

export const RequestFunction = async (isToken = false, url, headers, data) => {
    if (isToken) headers.Authorization = `${headers.Authorization}`
    return await axios.post(url, {
        ...data
    }, { headers })
        .then((res) => res)
        .catch((error) => {
            if (!!error.response) {
                console.log(error.response.data)
                throw (handleError(error.response.status))
            } else {
                console.log(error)
                throw (handleError('etc'))
            }
        })
}

// ===== Hendle Error =====

export const handleError = (error) => {
    if (error === 400) return 'Bad Request'
    else if (error === 401) return 'Unauthorized'
    else if (error === 403) return 'Forbidden'
    else return 'Something went wrong, Please contact the developer'
}

// ===== Query statucture (Prisma) =====

const prisma = new PrismaClient()

export const SET_LOG = async (payload) => {
    try {
        if (!!payload) {
            return await prisma.logtranscimb.create({
                data: {
                    log_income: payload.log_income,
                    trans_flag: payload.trans_flag === '1' ? e_trans_flag.DESPOSIT : e_trans_flag.WITHDRAW,
                    coop_key: payload.coop_key,
                    sigma_key: uuid(),
                    log_response: payload.log_response
                }
            })
        } else throw "Payload not complete"
    } catch (e) {
        return `(Prisma) Error : ${e}`
    }
}

