import forge from 'node-forge'
import CryptoJS from 'crypto-js'
import moment from 'moment'
import { amtDecimal } from '#libs/Functions'
import configs from '#constants/configs'

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
        })
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
        const mgate_channel = body.bu_encode

        let ProxyType = body.trans_type, ToBankID = ''

        if (!body.trans_type || body.trans_type === '') ProxyType = 'NATID'
        if (body.trans_type === 'ACCNO') ToBankID = body.bank_id

        let ClientTransactionNo, BeneficiaryName = 'INQUIRY', SenderReference = 'INQUIRY'
        if (body.routePath === '/getStatusV2CIMB' || body.routePath === '/confirmFunsTransferCIMB') {
            ClientTransactionNo = body.ClientTransactionNo
            if (body.routePath === '/confirmFunsTransferCIMB' && process.env.NODE_ENV === 'prod') {
                BeneficiaryName = body.Beneficiary_Name
                SenderReference = body.SenderReference
            } else {
                // ? UAT
                BeneficiaryName = "Deverloper"
                SenderReference = "UAT123456"
                ProxyType = 'NATID'
                body.destination = '1100701675044'
            }
        }
        else ClientTransactionNo = `COOP${transaction_timestance}`

        let myjson
        if (body.routePath === '/confirmFunsTransferCIMB' || body.routePath === '/inquiryAccountCIMB') {
            myjson = {
                "ClientTransactionNo": `${ClientTransactionNo}`,
                "ClientTransactionTimestamp": transaction_timestance,
                "ProxyType": ProxyType,
                "ProxyID": body.destination,
                "ToBankID": ToBankID,
                "BeneficiaryName": BeneficiaryName,
                "Amount": amtDecimal(body.amt_transfer),
                "SenderName": body.SenderName,
                "SenderID": body.card_person ?? '',
                //"SenderAddress": "TH|67-6 ro",
                //"SenderDateOfBirth": "20000705",
                //"SenderPlaceOfBirth": "Test Place",
                "SenderReference": SenderReference,
                //"SenderIDOther": "M35772699",
                "AdditionalInfo": {
                    "SenderInfo": {
                        "SenderIDType": "NIDN",
                        "BirthPlace": "TH",
                        "CountryCd": "TH",
                        "ProvinceCd": "Bangkok"
                    }
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

