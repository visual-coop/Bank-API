import Redis from 'ioredis'
import { promisify } from 'util'
import configs from '#constants/configs'
import { logger } from '#Utils/logger'

const redisConnection = () => {
    return new Promise((resolve, reject) => {
        const redis = new Redis({ ...configs[process.env.NODE_ENV].redis })
        redis.on('connect', () => {
            logger.info(`Redis Client Connected`)
            resolve(redis)
        })

        redis.on('error', (error) => {
            logger.error(`Redis connection error => ${error}`)
            reject(error)
        })
    })
}

const redisClient = await redisConnection()

const getAsync = promisify(redisClient.get).bind(redisClient)
const setAsync = promisify(redisClient.set).bind(redisClient)
const setExAsync = promisify(redisClient.setex).bind(redisClient)
const delCache = promisify(redisClient.del).bind(redisClient)
const flushCache = promisify(redisClient.flushall).bind(redisClient)

export { redisClient, getAsync, setAsync, setExAsync , delCache, flushCache }