import express from 'express'
import cors from 'cors'
import compression from 'compression'
import helmet from 'helmet'
import hpp from 'hpp'
import https from 'https'
import fs from 'fs'
import morgan from 'morgan'
import configs from '#constants/configs'
import { RedisService } from '#Services/redis.service'
import { InitializeRoute } from '#Routes/initialize.route'
import { BanksRoute } from '#Routes/banks.route'
import { AinuRoute } from '#Routes/ainu.route'
import { getDirName } from '#Utils/helper'
import { stream , logger } from '#Utils/logger'
import { ErrorMiddleware } from '#middleware/error.middleware'

class Server {

    #mode = process.env.NODE_ENV 
    #__dirname = getDirName(import.meta.url)

    constructor() {
        this.app = express()
        this.port = process.env.PORT || configs.SERVER_PORT
        this.#initializeMiddlewares()
        this.#initializeRoutes()
        this.#initializeCache()
        this.#initializeErrorHandling()
    }

    #initializeMiddlewares() {
        this.app.use(ErrorMiddleware)
        this.app.use(morgan(configs[this.#mode].LOG_FORMAT, { stream }))
        this.app.use(cors({ origin: '*', credentials: true }))
        this.app.use(hpp())
        this.app.use(helmet())
        this.app.use(compression())
        this.app.use(express.json({ limit : '12mb' }))
        this.app.use(express.urlencoded({ extended: true,limit : '12mb' }))
    }

    #initializeRoutes() {
        this.app.use('/', new InitializeRoute().router)
        this.app.use('/', new BanksRoute().router)
        this.app.use('/auth', new AinuRoute().router)
    }

    #initializeErrorHandling() {
        this.app.use(ErrorMiddleware)
    }

    #initializeCache() {
        new RedisService().initializeCache()
    }

    listen() {
        const options = {
            key: fs.readFileSync(`${this.#__dirname}/constants/cert/key.pem`),
            cert: fs.readFileSync(`${this.#__dirname}/constants/cert/thaicoop_co_2023.crt`),
            rejectUnauthorized: false
        }
        const server = https.createServer(options, this.app)
        server.listen(this.port, () => {
            logger.info(`Server Listening on PORT => ${this.port}`)
            logger.info(`Mode => ${this.#mode === 'dev' ? 'Deverlopment' : 'Production'}`)
        })
    }
}

new Server().listen()


