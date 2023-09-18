import configs from '#constants/configs'
import { RequestFunction } from '#libs/Functions'
import { BUFFER_QUERY,cron_status_actions } from '#cache/redis'
import { KTB_BINDACC_BUFFER } from '#cache/redis'

export const update_process = async (keys) => {
    const external_path = await (await RequestFunction.get(false, configs.CONFIG_EXTERNAL, null, null)).data
    if (external_path) {
        let COOP_NAME = keys[0]

        keys.forEach(async (key) => {
            const sigma_key = key.split(":").slice(-1)
            await KTB_BINDACC_BUFFER.GET_WITH_KEY(key)
                .then(async (res) => {
                    await RequestFunction.post(false, external_path[JSON.parse(res).url_coop], null, JSON.parse(res))
                        .then(async (res_bind) => {
                            if (res_bind.data.RESULT) {
                                await KTB_BINDACC_BUFFER.DEL_WITH_KEY(key)
                                console.log(`[KTB][API - UPDATE PROCESS] Successfully : '${sigma_key}'`)
                            } else if (res_bind.data.RESPONSE_CODE === 'WS9002') {
                                // Expire token, TODO : Insert to  Database
                                await KTB_BINDACC_BUFFER.DEL_WITH_KEY(key)
                                console.log(`[KTB][API - UPDATE PROCESS] Error : '${sigma_key}'`)
                                console.log(`[KTB][API - UPDATE PROCESS] Action : '${sigma_key}' is cached , ${res_bind.data.RESPONSE_MESSAGE}`)
                            } else {
                                console.log(`[KTB][API - UPDATE PROCESS] Action : '${sigma_key}' is cached`)
                                console.log(`[KTB][API - UPDATE PROCESS] Error : '${sigma_key}'`)
                            }
                        })
                })
                .catch(e => {
                    console.log(`[KTB][API - UPDATE PROCESS] Error : ${e}'`)
                    console.log(`[KTB][API - UPDATE PROCESS] Action : '${sigma_key}' is cached`)
                })
        })
        await cron_status_actions.SET(COOP_NAME.split(':')[1],'0')
    } else {
        console.log(`[KTB][API - ${req.route.path}] Error - Cannot call external_path : '${configs.CONFIG_EXTERNAL}'`)
        console.log(`[KTB][API - ${req.route.path}] Error - Cannot call external_path : '${configs.CONFIG_EXTERNAL}'`)
    }
}