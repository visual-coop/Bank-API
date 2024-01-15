import CryptoJS from "crypto-js"
import https from 'https'
import fs from 'fs'
import { getDirName } from "#Utils/helper"

export const constants = {
    bankNameTH : "ธนาคารกสิกรไทย จำกัด (มหาชน)",
    bankNameEN : "Kasikornbank Public Company Limited",
    bankNameInit : "kbank",
    bankCode : '004',
    credentials : {
        sandbox: {
            consumer_id: "OO1KnihSPudQzLxxky4zt6ekNApho4lK",
            consumer_secret: "w7vvikhFZhVxxPrl"
        },
        dev: {
            consumer_id: "NcS1V4JDPaFF5OF0xuCqhpY8jaoK9nnt",
            consumer_secret: "NXGYd1iG2j7vlLNe"
        }
    }
}

const __dirname = getDirName(import.meta.url)

export const httpsAgent = new https.Agent({
    key: fs.readFileSync(`${__dirname}/../constants/cert/thaicoop.co-18Jan2025.pem`),
    cert: fs.readFileSync(`${__dirname}/../constants/cert/thaicoop.co-18Jan2025.crt`),
    rejectUnauthorized: false
})

export const Base64Encoded = (payload) => {
    const encodedWordArray = CryptoJS.enc.Utf8.parse(payload)
    return CryptoJS.enc.Base64.stringify(encodedWordArray)
}

export const Base64Decoded = (payload) => {
    const wordArray = CryptoJS.enc.Base64.parse(payload)
    return decodedString = CryptoJS.enc.Utf8.stringify(wordArray)
}
