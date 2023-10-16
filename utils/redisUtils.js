import Redis from 'ioredis'
import { promisify } from 'util'
import { c_time } from '#Utils/utility.func'
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

const redisClient = await redisConnection()

const getAsync = promisify(redisClient.get).bind(redisClient)
const setAsync = promisify(redisClient.set).bind(redisClient)
const setExAsync = promisify(redisClient.setex).bind(redisClient)
const delCache = promisify(redisClient.del).bind(redisClient)

export { redisClient, getAsync, setAsync, setExAsync ,delCache }