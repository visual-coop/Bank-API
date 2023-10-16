import { RequestFunction , c_time } from "#Utils/utility.func"
import { SessionManager } from "#Services/redis.service"
import * as kbank from "#Utils/kbank.func"
import * as endpoint from "#constants/api_endpoint"

const mode = process.env.NODE_ENV
const session = new SessionManager()

export const oAuthV2KBNAK = async (req, res, next) => {
    const credential = `${kbank.constants.credentials[mode].consumer_id}:${kbank.constants.credentials[mode].consumer_secret}`

    try {
        if (await session.getStatus(req.body.unique_key, kbank.constants.bankNameInit)) {
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
            await session.set(req.body.unique_key, kbank.constants.bankNameInit, result.data)
        }
        next()
    } catch (error) {
        console.error(`[${c_time()}][Authorization] Unauthorized => ${error}`)
        res.status(400).end(`[${c_time()}][Authorization] Unauthorized => ${error}`)
    }
}

