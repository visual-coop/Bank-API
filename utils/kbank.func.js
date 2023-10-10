import CryptoJS from "crypto-js"
import https from 'https'
import fs from 'fs'
import { getDirName } from '#libs/helper'

const __dirname = getDirName(import.meta.url)

export const httpsAgent = new https.Agent({
    key: fs.readFileSync(`${__dirname}/../../constants/cert/key.pem`),
    cert: fs.readFileSync(`${__dirname}/../../constants/cert/thaicoop_co_2023.crt`),
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