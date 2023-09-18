import express from 'express'
import * as KTB from '#libs/Functions_KTB'
import configs from '#constants/configs'
import { RequestFunction } from '#libs/Functions'
import { KTB_BINDACC_BUFFER } from '#cache/redis'

const router = express.Router()
router.use(express.json())
router.use(express.urlencoded({
    extended: true,
    defer: true
}))

router.post('/confirmApprove', async (req, res) => {
    const external_path = await (await RequestFunction.get(false, configs.CONFIG_EXTERNAL, null, null)).data
    if (external_path) {
        req.body.indate = new Date()
        const args = [
            req.body.action,
            req.body.sigma_key,
            req.body.url_coop
        ]
        await KTB_BINDACC_BUFFER.SET(req.body)
            .then(async () => {
                if (await KTB_BINDACC_BUFFER.GET_BOOL(...args)) {
                    await KTB_BINDACC_BUFFER.GET(...args)
                        .then(async (get_buffer) => {
                            await RequestFunction.post(false, external_path[req.body.url_coop], null, JSON.parse(get_buffer))
                                .then(async (res_bind) => {
                                    if (res_bind.data.RESULT === true) {
                                        await KTB_BINDACC_BUFFER.DEL(...args)
                                        console.log(`[KTB][API - ${req.route.path}] Successfully : '${req.body.sigma_key}'`)
                                        res.json({ result: `[KTB][API - ${req.route.path}] Successfully : '${req.body.sigma_key}'` })
                                    } else {
                                        console.log(`[KTB][API - ${req.route.path}] Action : '${req.body.sigma_key}' is cached`)
                                        res.json({ result: `[KTB][API - ${req.route.path}] Error : '${req.body.sigma_key}'` })
                                    }
                                })
                                .catch(e => {
                                    console.log(`[KTB][API - ${req.route.path}] Error - ${e}'`)
                                    console.log(`[KTB][API - ${req.route.path}] Action : '${req.body.sigma_key}' is cached`)
                                    res.json({ result: `[KTB][API - ${req.route.path}] Error : '${req.body.sigma_key}'` })
                                })
                        })
                        .catch(e => {
                            console.log(`[KTB][API - ${req.route.path}][Redis] Error - ${e}'`)
                            res.json({ result: `[KTB][API - ${req.route.path}] Error : '${req.body.sigma_key}'` })
                        })
                }
            })
            .catch(e => {
                console.log(`[KTB][API - ${req.route.path}][Redis] Error - ${e}'`)
                res.json({ result: `[KTB][API - ${req.route.path}] Error : '${req.body.sigma_key}'` })
            })
    } else {
        console.log(`[KTB][API - ${req.route.path}] Error - Cannot call external_path : '${configs.CONFIG_EXTERNAL}'`)
        res.json({ result: `[KTB][API - ${req.route.path}] Error - Cannot call external_path : '${configs.CONFIG_EXTERNAL}'` })
    }
})

router.post('/getBuffer', async (req, res) => {
    const data = await KTB_BINDACC_BUFFER.GET_MONIT(req.body.query)
    res.json({ result: data })
})

router.post('/ManualUpdate', async (req, res) => {
    req.body.sigma_key = req.body.key.split(":").slice(-1)
    console.log(`Manual Update with Sigma key : ${req.body.sigma_key}`)

    const external_path = await (await RequestFunction.get(false, configs.CONFIG_EXTERNAL, null, null)).data
    if (external_path) {
        await KTB_BINDACC_BUFFER.GET_MONIT(req.body.key)
            .then(async (buffer_key) => {
                buffer_key = buffer_key[0]
                await KTB_BINDACC_BUFFER.GET_WITH_KEY(buffer_key)
                    .then(async (get_buffer) => {
                        await RequestFunction.post(false, external_path[JSON.parse(get_buffer).url_coop], null, JSON.parse(get_buffer))
                            .then(async (res_bind) => {
                                if (res_bind.data.RESULT) {
                                    await KTB_BINDACC_BUFFER.DEL_WITH_KEY(buffer_key)
                                    console.log(`[KTB][API - ${req.route.path}] Successfully : '${req.body.sigma_key}'`)
                                    res.json({ result: `[KTB][API - ${req.route.path}] Successfully : '${req.body.sigma_key}'` })
                                } else {
                                    console.log(`[KTB][API - ${req.route.path}] Action : '${req.body.sigma_key}' is cached`)
                                    res.json({ result: `[KTB][API - ${req.route.path}] Error : '${req.body.sigma_key}'` })
                                }
                            })
                            .catch(e => {
                                console.log(`[KTB][API - ${req.route.path}] Error - ${e}'`)
                                console.log(`[KTB][API - ${req.route.path}] Action : '${req.body.sigma_key}' is cached`)
                                res.json({ result: `[KTB][API - ${req.route.path}] Error : '${req.body.sigma_key}'` })
                            })
                    })
                    .catch(e => {
                        console.log(`[KTB][API - ${req.route.path}][Redis] Error - ${e}'`)
                        res.json({ result: `[KTB][API - ${req.route.path}] Error : '${req.body.sigma_key}'` })
                    })
            })
            .catch(e => {
                console.log(`[KTB][API - ${req.route.path}][Redis] Error - ${e}'`)
                res.json({ result: `[KTB][API - ${req.route.path}] Error : '${req.body.sigma_key}'` })
            })

    } else {
        console.log(`[KTB][API - ${req.route.path}] Error - Cannot call external_path : '${configs.CONFIG_EXTERNAL}'`)
        res.json({ result: `[KTB][API - ${req.route.path}] Error - Cannot call external_path : '${configs.CONFIG_EXTERNAL}'` })
    }
})

export default router