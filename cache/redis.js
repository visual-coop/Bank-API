import { createClient } from 'redis'
import { GATEWAY_DB_CIMB } from '#db/query'
import { config_cimb_v2 } from '#API/CIMB/config'

const Client = createClient()

Client.on('error', err => console.log('Redis Client Error', err))

export const Startup_Config = async () => {
    await Client.connect()
    if (Client.isOpen) {
        console.log("[Redis] Client Listening on PORT =>", 6379)
        await Client.set('INIT_CONFIGS:CIMB', JSON.stringify(await GATEWAY_DB_CIMB.GET_INIT_TO_CACHE()))
    }
}

export const get_init_config = async (bank) => {
    return await Client.get(`INIT_CONFIGS:${bank}`)
}

// ===== CIMB ====== //

export const CIMB_TOKEN = {
    type: 'TRANSACTION',
    async SET(uuid, token) {
        await Client.setEx(
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


