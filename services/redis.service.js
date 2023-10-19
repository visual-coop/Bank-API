import { CIMBServices } from "#Services/banks.service"
import { redisClient ,getAsync , setAsync, setExAsync, delCache, flushCache } from "#Utils/redisUtils"
import { logger } from "#Utils/logger"

export class RedisService {

    cimb = new CIMBServices()

    initializeCache = async () => {
        if (redisClient.status === 'connect') {
            if (process.env.NODE_ENV === 'prod') {
                const result = await flushCache()
                logger.info(`Clear cache status => ${result}`)
            }
            await setAsync('INIT_CONFIGS:CIMB',JSON.stringify(await this.cimb.getBankProvide()))
        }
    }

    static getinitializeCache = async (payload) => {
        return await getAsync(`INIT_CONFIGS:${payload}`)
    }
}

export class SessionManager {
    type = "SESSION_TRANS"

    set = async (uuid, bank, token, timeout = null) => {
        await setExAsync(
            `${this.type}:${bank}:${uuid}`,
            timeout ?? 28 * 60,
            JSON.stringify(token)
        )
    }

    /**
     * If it's null will return be 'true'
     * @date 10/16/2023 - 3:27:03 PM
     *
     * **/
    getStatus = async (uuid,bank) => {
        if (await getAsync(`${this.type}:${bank}:${uuid}`) === null) return true
    }

    getRawData = async (uuid, bank) => {
        return JSON.parse(await getAsync(`${this.type}:${bank}:${uuid}`))
    }

    getAuth = async (uuid, bank) => {
        const result = JSON.parse(await getAsync(`${this.type}:${bank}:${uuid}`))
        return result?.access_token ?? null
    }

    endSession = async (uuid, bank) => {
        await delCache(`${this.type}:${bank}:${uuid}`)
    }
}