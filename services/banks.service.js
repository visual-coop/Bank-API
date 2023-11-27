import { DBConnection } from "#Services/dbs.conection"
import { RedisService } from "#Services/redis.service"

export class CIMBServices extends DBConnection {

    #mode = process.env.NODE_ENV
    
    getBankProvide = async () => {
        try {
            const query = `SELECT 
            public_key,
            client_ref_id,
            client_id,
            channel_id,
            coop_key,
            secret_key,
            opay_encrypt_key64,
            opay_encrypt_iv64,
            x_apigw_api_id,
            bu_encode
            FROM coop_provide_cimb_v2`
            const result = (await this.mysql.query(query))[0]
            return result
        } catch (error) {
            throw error
        }
    }

    transLog = async (payload) => {
        try {
            const query = `INSERT INTO logtranscimb
            (
                log_income,
                trans_flag,
                coop_key,
                sigma_key,
                log_response
            ) VALUES ( ?, ?, ?, ?, ?)
            `
            const bind = [
                JSON.stringify(payload.log_income),
                payload.trans_flag,
                payload.coop_key,
                payload.sigma_key,
                JSON.stringify(payload.log_response)
            ]
            const result = await this.mysql.query(query, bind)
            return result
        } catch (error) {
            throw error
        }
    }

    constantsInit = async (coop,bankNameInit) => {
        return (JSON.parse(await RedisService.getinitializeCache(bankNameInit)))
            // *** @ 11-15-23 Unavaliable UAT mode ****
            //.filter(result => result.coop_key === (this.#mode !== 'dev' ? coop : 'uat'))[0]
            .filter(result => result.coop_key === coop)[0]
    }

}

export class KBANKService extends DBConnection {
    
    GetPayerInfo = async (coopKey) => {
        try {
            const query = `SELECT merchant_id,payer_account,service_name FROM coop_provide_kbank WHERE coop_key = ?`
            const bind = [ coopKey ]
            const result = (await this.mysql.query(query, bind))[0]
            return result[0]
        } catch (error) {
            throw error
        }
    }

    transLog = async (payload) => {
        try {
            const query = `INSERT INTO logtranskbank
            (
                log_income,
                trans_flag,
                coop_key,
                sigma_key,
                log_response
            ) VALUES ( ?, ?, ?, ?, ?)
            `
            const bind = [
                JSON.stringify(payload.log_income),
                payload.trans_flag,
                payload.coop_key,
                payload.sigma_key,
                JSON.stringify(payload.log_response)
            ]
            const result = await this.mysql.query(query, bind)
            return result
        } catch (error) {
            throw error
        }
    }
}