import cron from 'node-cron'
import { RequestFunction } from '#libs/Functions'
import { BUFFER_QUERY, cron_status_actions } from '#cache/redis'
import crons_config from "#constants/crons" assert { type: 'json'}
import { update_process as KTB } from '#libs/Functions_KTB'

cron.schedule('*/10 * * * * *', () => {
    Object.values(cron_lists).forEach(call => call())
})

const init = async (COOP_NAME, funcResponce = () => {}, funcException = () => {}) => {
    const data_buffer = await BUFFER_QUERY(`:${COOP_NAME.toUpperCase()}:`)
    if (Array.isArray(data_buffer) && !data_buffer.length) return
    if (!crons_config[`${COOP_NAME}_cron_status`]) return
    await cron_status_actions.SET(COOP_NAME, '1')
    if (await cron_status_actions.GET(COOP_NAME) === '1') {
        COOP_NAME = COOP_NAME.toLowerCase()
        const time = Date.now()
        await RequestFunction.get(false, `${crons_config[`${COOP_NAME}_path`]}`, null, null, 4000, false)
            .then(() => {
                console.log(`[${COOP_NAME.toUpperCase()} CONNECTION] Status : Connected! , Time : ${Date.now() - time} ms`)
                funcResponce(data_buffer)
            })
            .catch((e) => {
                funcException()
                console.log(`[${COOP_NAME.toUpperCase()} CONNECTION] Status : Disconnected! , Time : ${Date.now() - time} ms, Error : ${e}`)
            })
    } else return
}

const cron_lists = {
    async pea() {
        init('pea', async (data_buffer) => {
            KTB(data_buffer)
        })
    },
    async igat() {
        init('igat', async () => {

        })
    },
    async mhs() {
        init('mhs', async (data_buffer) => {
            KTB(data_buffer)
        })
    }
}
