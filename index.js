import express from 'express'
import cors from 'cors'
import https from 'https'
import fs from 'fs'
import configs from '#constants/configs'
import { RedisService } from '#Services/redis.service'
import { InitializeRoute } from '#Routes/initialize.route'
import { BanksRoute } from '#Routes/banks.route'
import { c_time } from '#Utils/utility.func'
import { getDirName } from '#Utils/helper'

class Server {

    __dirname = getDirName(import.meta.url)

    constructor() {
        this.app = express()
        this.port = process.env.PORT || configs.SERVER_PORT
        this.#initializeMiddlewares()
        this.#initializeRoutes()
        new RedisService().initializeCache()
    }

    #initializeMiddlewares() {
        this.app.use(cors({origin : process.env.ORIGIN , credentials : process.env.ORIGIN}))
        this.app.use(express.json())
        this.app.use(express.urlencoded({ extended: true }))
    }

    #initializeRoutes() {
        this.app.use('/',new InitializeRoute().router)
        this.app.use('/',new BanksRoute().router)
    }

    listen() {
        const options = {
            key: fs.readFileSync(`${this.__dirname}/constants/cert/key.pem`),
            cert: fs.readFileSync(`${this.__dirname}/constants/cert/thaicoop_co_2023.crt`),
            rejectUnauthorized: false
        }
        const server = https.createServer(options, this.app)
        server.listen(this.port, async () => {
            console.log(`[${c_time()}][API] Server Listening on PORT :`, this.port)
            console.log(`[${c_time()}][Mode] : ${process.env.NODE_ENV === 'dev' ? 'Deverlopment' : 'Production'}`)
        })
    }
}

new Server().listen()


