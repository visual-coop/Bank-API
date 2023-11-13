import { HttpException } from '#Exceptions/HttpException'
import { v4 as uuid } from 'uuid'
import axios from 'axios'
import moment from 'moment'
import configs from '#constants/configs'

// ===== Util Functions =====

export const c_time = () => {
    return moment().format('YYYY-MM-DD HH:mm:ss')
}

export const gen_sigma_key = () => {
    return uuid()
}

export const genUUID = () => {
    return uuid()
}

export const genGUID = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''

    for (let i = 0; i < 64; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length)
        result += characters.charAt(randomIndex)
    }

    return result
}

export const formatMysqlDate = (date) => {
    return moment(date).format("YYYY-MM-DD HH:mm:ss")
}

export const checkCompleteArgument = (arg_keys, payload) => {
    let result = true
    arg_keys.forEach(key => {
        if (payload.hasOwnProperty(key)) {
            if (payload[key] === '' || payload[key] === null || payload[key] === undefined || payload[key] === 'undefined') {
                result = false
                throw new HttpException(400, `[Payload arg error] => name : ${key} , type : ${typeof payload[key]} , value : ${payload[key]}`)
            }
        }
    })
    return result
}

export const amtDecimal = (value) => {
    if (!value.includes('.')) return `${value}00`
    else {
        const value_splited = value.split('.')
        if (!!value_splited[1]) {
            if (value_splited[1].length < 2) {
                return `${value_splited[0]}${value_splited[1].padEnd(3 - value_splited[1].length, '0')}`
            } else return `${value_splited[0]}${value_splited[1].substring(0, 2)}`
        } else return `${value_splited[0]}00`
    }
}

export const pad_amt = (value) => {
    const value_splited = value.split('.')
    if (!!value_splited[1]) {
        if (value_splited[1] === '0' || value_splited[1] === '00') return value_splited[0]
        if (value_splited[1].length === 0) return `${value_splited[0]}.${value_splited[1].padEnd(2, '0')}`
        if (value_splited[1].length < 2) return `${value_splited[0]}.${value_splited[1].padEnd(3 - value_splited[1].length, '0')}`
        else return `${value_splited[0]}.${value_splited[1].substring(0, 2)}`
    }
    return value_splited[0]
}

export const fillWithZeros = (str, digi) => {
    while (str.length < digi) str = '0' + str
    return str
}

export const bank_api_path_ = async () => {
    return (await RequestFunction.get(false, configs.BANK_API_PATH, null, null)).data
}

export const bank_api_path = async () => {
    const urls = (await RequestFunction.get(false, configs.BANK_API_PATH, null, null)).data, result = {}
    if (configs.MODE === 'PROD') {
        for (const key of configs.BANK_API_PATH_SELECT) {
            if (urls.hasOwnProperty(key)) {
                result[key] = urls[key];
            }
        }
    } else {
        for (const key of configs.BANK_API_PATH_SELECT) {
            if (urls.hasOwnProperty(key)) {
                result[key] = urls[`${key}_UAT`];
            }
        }
    }
    return result
}

export const getLastPathSegment = (path) => {
    const pathSegments = path.split('/')
    return  `/${pathSegments[pathSegments.length - 1]}`
}

// ===== Request API =====

export const RequestFunction = {
    async get(isToken = false, url, headers, data, timeout = null, showErr = true) {
        if (isToken) headers.Authorization = `${headers.Authorization}`
        return await axios.get(url, {
            ...data
        }, { headers, timeout: timeout })
            .then((res) => res)
            .catch((error) => {
                if (showErr) {
                    if (!!error.response) {
                        throw new HttpException(error.response.status,error.response.data)
                    } else {
                        throw new HttpException(408,'Request Timeout')
                    }
                }
            })
    },
    async post(isToken = false, url, headers, data, { timeout = null, showErr = true, ssl = null }) {
        if (isToken) headers.Authorization = `${headers.Authorization}`
        return await axios.post(url, {
            ...data
        }, { headers, timeout: timeout, httpsAgent: ssl })
            .then((res) => res)
            .catch((error) => {
                if (!!error.response) {
                    throw new HttpException(error.response.status,error.response.data)
                } else {
                    throw new HttpException(408,'Request Timeout')
                }
            })
    },
    async formData(isToken = false, url, headers, form, { timeout = null, showErr = true, ssl = null }) {
        if (isToken) headers.Authorization = `${headers.Authorization}`
        return await axios.post(url, form, { headers, timeout: timeout, httpsAgent: ssl })
            .then((res) => res)
            .catch((error) => {
                if (!!error.response) {
                    throw new HttpException(error.response.status,error.response.data)
                } else {
                    throw new HttpException(408,'Request Timeout')
                }
            })
    }
}


// ===== Hendle Error =====

export const handleError = (error) => {
    if (error === 400) return 'Bad Request'
    else if (error === 401) return 'Unauthorized'
    else if (error === 403) return 'Forbidden'
    else if (error === 408) return 'Request Timeout'
    else return 'Something went wrong, Please contact the developer'
}

