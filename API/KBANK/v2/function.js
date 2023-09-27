import CryptoJS from "crypto-js"

export const Base64Encoded = (payload) => {
    const encodedWordArray = CryptoJS.enc.Utf8.parse(payload)
    return CryptoJS.enc.Base64.stringify(encodedWordArray)
}

export const Base64Decoded = (payload) => {
    const wordArray = CryptoJS.enc.Base64.parse(payload)
    return decodedString = CryptoJS.enc.Utf8.stringify(wordArray)
}