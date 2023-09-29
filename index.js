import express from 'express'
import cors from 'cors'
import https from 'https'
import fs from 'fs'
import CIMB__api__v2 from '#API/CIMB/v2/main'
import KTB__api__v1 from '#API/KTB/v1/main'
import KBANK__api__v2 from '#API/KBANK/v2/main'
import { getDirName } from '#libs/helper'
import { Startup_Config as radis } from '#cache/redis'
import configs from '#constants/configs'
import { c_time } from '#libs/Functions'


// INIT
const PORT = process.env.PORT || configs.api_port
const router = express()
const __dirname = getDirName(import.meta.url)

router.use(cors())
//router.use('/KTB/v1',KTB__api__v1)
router.use('/CIMB/v2',CIMB__api__v2)
router.use('/KBANK/v2',KBANK__api__v2)

router.get('*', (req, res) => {
    res.sendFile(`${__dirname}/src/index.html`)
})

// HTTPS
const options = {
    key: fs.readFileSync(`${__dirname}/constants/cert/sccl_privatekey.key`),
    cert: fs.readFileSync(`${__dirname}/constants/cert/icoop-sccl_stou_ac_th.crt`)
}
const server = https.createServer(options,router)

server.listen(PORT, async () => {
    console.log(`[${c_time()}][API] Server Listening on PORT :`, PORT)
    await radis()
    console.log(`[${c_time()}][Mode] : ${configs.MODE}`)
})

