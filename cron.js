import express from 'express'
import cors from 'cors'
import '#libs/cron'
import { Startup_Config as radis } from '#cache/redis'

// INIT
const PORT = process.env.PORT || 10010
const router = express()
router.use(cors())

router.listen(PORT, async () => {
    console.log("[CRONS PROCESS] Server Listening on PORT =>", PORT)
    await radis()
})

