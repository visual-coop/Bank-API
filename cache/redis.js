import Redis from 'ioredis'
import moment from 'moment'
import { DB_CIMB} from '#db/query'
import { config_cimb_v2 } from '#API/CIMB/config'
import configs from '#constants/configs'
import { c_time } from '#libs/Functions'

const redisConnection = () => {
    return new Promise((resolve, reject) => {
        const redis = new Redis({ ...configs[process.env.NODE_ENV].redis })
        redis.on('connect', () => {
            console.log(`[${c_time()}][Redis] Client Listening on PORT :`, configs[process.env.NODE_ENV].redis.port)
            resolve(redis)
        })

        redis.on('error', (error) => {
            console.error(`[${c_time()}][Redis] Connection error :`, error)
            reject(error)
        })
    })
}

const Client = await redisConnection()

export const Startup_Config = async () => {
    if (Client.status == 'connect') {
        //Client.configSet("notify-keyspace-events", "Ex")
        await Client.set('INIT_CONFIGS:CIMB', JSON.stringify(await DB_CIMB.GetBankProvide()))
        const coops = ['PEA', 'IGAT']
        coops.forEach(async (coop) => await Client.set(`CRON_${coop}:STATUS`, '0'))
    }
    // const sub = Client.duplicate()
    // await sub.connect()

    // sub.subscribe("__keyevent@0__:expired", async (key) => {
    //     const payload = await Client.get(`${key}:EX`)
    //     await COOP_DB.SET_BUUFER_LOG(JSON.parse(payload))
    //     console.log('Del =>', key)
    //     await Client.del(`${key}:EX`)
    // })
}

export const cron_status_actions = {
    async GET(coop_name) {
        return await Client.get(`CRON_${coop_name.toUpperCase()}:STATUS`)
    },
    async SET(coop_name, processing) {
        await Client.set(`CRON_${coop_name.toUpperCase()}:STATUS`, processing)
        return true
    }
}

export const get_init_config = async (bank) => {
    return await Client.get(`INIT_CONFIGS:${bank}`)
}

export const BUFFER_QUERY = async (query) => {
    return await Client.keys(`*${query}*`)
}

export const setEx = async (key, value, ttl) => {
    await Client.set(key, value)
    // await Client.publish('expireValue', JSON.stringify({ key, value }))
    await Client.expire(key , ttl)
}

export const token_session = {
    type: 'SESSION_TRANS',
    async SET (uuid,bank,token) {
        await Client.setex(
            `${this.type}:${bank}:${uuid}`,
            28 * 60, //  28 Minute
            JSON.stringify(token)
        )
    },
    async GET (uuid,bank) {
        if (await Client.get(`${this.type}:${bank}:${uuid}`) === null) return true
    },
    async GET_RAW(uuid,bank) {
        return JSON.parse(await Client.get(`${this.type}:${bank}:${uuid}`))
    },
    async GET_AUTH (uuid,bank) {
        const result = JSON.parse(await Client.get(`${this.type}:${bank}:${uuid}`))
        return result?.access_token ?? null
    },
    async DEL (uuid,bank) {
        await Client.del(`${this.type}:${bank}:${uuid}`)
    }
}

// ===== CIMB ====== //

export const CIMB_TOKEN = {
    type: 'TRANSACTION',
    async SET(uuid, token) {
        await Client.setex(
            `${this.type}:${config_cimb_v2.bank_name}:${uuid}`,
            13 * 60, // 13 Minute
            JSON.stringify(token)
        )
    },
    async GET(uuid) {
        if (await Client.get(`${this.type}:${config_cimb_v2.bank_name}:${uuid}`) === null) return true
    },
    async GET_RAW(uuid) {
        return await Client.get(`${this.type}:${config_cimb_v2.bank_name}:${uuid}`)
    },
    async GET_AUTH(uuid) {
        const result = JSON.parse(await Client.get(`${this.type}:${config_cimb_v2.bank_name}:${uuid}`))
        return result?.access_token ?? null
    },
    async DEL(uuid) {
        await Client.del(`${this.type}:${config_cimb_v2.bank_name}:${uuid}`)
    }
}

// ================= //

// ===== KTB ====== //

export const KTB_BINDACC_BUFFER = {
    type: 'BINDACCOUNTBUFFER',
    log: `[BUFFER - ${moment().format()}]`,
    COOP_NAME(name) {
        return name.split('-')[0].toUpperCase()
    },
    async SET(payload) {
        console.log(`${this.log}[SET] - ${this.type}:${this.COOP_NAME(payload.url_coop)}:KTB:${payload.action}:${payload.sigma_key}`)
        // * ตัวอย่าง Cache Statucture BINDACCOUNTBUFFER:COOP_NAME (เช่น PEA,EGAT):ACTION (เช่น  BIND,REVOKE):SIGMA_KEY
        await Client.setEx(`${this.type}:${this.COOP_NAME(payload.url_coop)}:KTB:${payload.action}:${payload.sigma_key}`, 60, JSON.stringify(payload))
        await Client.set(`${this.type}:${this.COOP_NAME(payload.url_coop)}:KTB:${payload.action}:${payload.sigma_key}:EX`, JSON.stringify(payload))
        return true
    },
    async GET(action, sigma_key, coop) {
        console.log(`${this.log}[GET] - ${this.type}:${this.COOP_NAME(coop)}:KTB:${action}:${sigma_key}`)
        return await Client.get(`${this.type}:${this.COOP_NAME(coop)}:KTB:${action}:${sigma_key}`)

    },
    async GET_BOOL(action, sigma_key, coop) {
        if (await Client.get(`${this.type}:${this.COOP_NAME(coop)}:KTB:${action}:${sigma_key}`) !== null) return true
        else throw `${this.type}:${this.COOP_NAME(coop)}:KTB:${action}:${sigma_key} - No data in cache`
    },
    async GET_MONIT(query) {
        return await Client.keys(`*${query}*`)
    },
    async DEL(action, sigma_key, coop) {
        console.log(`${this.log}[DEL] - ${this.type}:${this.COOP_NAME(coop)}:KTB:${action}:${sigma_key}`)
        await Client.del(`${this.type}:${this.COOP_NAME(coop)}:KTB:${action}:${sigma_key}`)
        return true
    },
    async GET_WITH_KEY(key) {
        if (await Client.get(key) !== null) {
            console.log(`${this.log}[GET_WITH_KEY] - ${key}`)
            return await Client.get(`${key}`)
        } else throw `${key} - No data in cache`
    },
    async DEL_WITH_KEY(key) {
        console.log(`${this.log}[DEL] - ${key}`)
        await Client.del(`${key}`)
        return true
    }
}

// ================= //


