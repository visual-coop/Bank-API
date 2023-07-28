import express from 'express'
import * as lib from '#libs/Functions'
import * as KTB from '#libs/Functions_KTB'
import { config_ktb_v1 } from '#API/KTB/config'

const router = express.Router()
router.use(express.json())
router.use(express.urlencoded({
    extended: true,
    defer: true
}))

router.post('/confirmApprove' , async (req,res) => {
    console.log(req.body)
    res.json('test')
})

export default router