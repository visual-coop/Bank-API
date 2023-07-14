import express from 'express'
import { getDirName } from './util/helper.js'
import api__v2 from './API/v2/index.js'

// INIT
const PORT = process.env.PORT || 10000
const router = express()
const __dirname = getDirName(import.meta.url)

router.use('/v2',api__v2)

router.get('*', (req, res) => {
    res.sendFile(`${__dirname}/src/index.html`)
})

router.listen(PORT, () => console.log("API Server Listening on PORT =>", PORT))
