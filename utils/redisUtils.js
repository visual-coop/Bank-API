import Redis from 'ioredis'
import { promisify } from 'util'
import configs from '#constants/configs'

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

const getAsync = promisify(Client.get).bind(Client)
const setAsync = promisify(Client.set).bind(Client)
const setExAsync = promisify(Client.setex).bind(Client)

export { getAsync, setAsync, setExAsync }