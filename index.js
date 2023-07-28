import express from 'express'
import cors from 'cors'
import CIMB__api__v2 from '#API/CIMB/v2/main'
import KTB__api__v1 from '#API/KTB/v1/main'
import { getDirName } from '#libs/helper'
import { Startup_Config as radis } from '#cache/redis'

// INIT
const PORT = process.env.PORT || 10003
const router = express()
const __dirname = getDirName(import.meta.url)

router.use(cors())
router.use('/KTB/v1',KTB__api__v1)
router.use('/CIMB/v2',CIMB__api__v2)

router.get('*', (req, res) => {
    res.sendFile(`${__dirname}/src/index.html`)
})

router.listen(PORT, async () => {
    console.log("[API] Server Listening on PORT =>", PORT)
    await radis()
})

