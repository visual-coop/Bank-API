import { genGUID } from '#libs/Functions'
import { PrismaClient as DB_CLIENT_COOP, e_trans_flag } from '@prisma-coop/client'
import { PrismaClient as DB_CLIENT_GATEWAY } from '@prisma-gateway/client'

// ===== Query statucture (Prisma) =====

export const COOP_DB = {
    DB_NAME: 'COOP',
    DB: new DB_CLIENT_COOP(),
    async SET_LOG (payload) {
        try {
            if (!!payload) {
                return await this.DB.logtranscimb.create({
                    data: {
                        log_income: payload.log_income,
                        trans_flag: payload.trans_flag === '1' ? e_trans_flag.DESPOSIT : e_trans_flag.WITHDRAW,
                        coop_key: payload.coop_key,
                        sigma_key: genGUID(),
                        log_response: payload.log_response
                    }
                })
            } else throw "Payload not complete"
        } catch (e) {
            return `[Prisma] [DB : ${this.DB_NAME}] Error : ${e}`
        }
    },
    async SET_BUUFER_LOG (payload) {
        try {
            if (!!payload) {
                return await this.DB.buffer_history.create({
                    data: {
                        body : payload,
                        sigma_key : payload.sigma_key
                    }
                })
            } else throw "Payload not complete"
        } catch (e) {
            return `[Prisma] [DB : ${this.DB_NAME}] Error : ${e}`
        }
    },
    async GET_LOGS (body) {
        try {
            const result = await this.DB.$queryRaw`SELECT  
            id_log
            ,log_income->>'$.tran_date' as tran_date
            ,log_income->>'$.ref_trans.ClientTransactionNo' as ref_trans  
            ,log_income->>'$.coop_key' as coop_key
            ,trans_flag 
            ,log_income->>'$.amt_transfer' as amt_transfer 
            ,log_income->>'$.coop_account_no' as coop_account_no 
            ,log_response->>'$.Description' as Description 
            FROM logtranscimb WHERE SUBSTRING(log_income->>'$.tran_date', 1, 10) = ${body.date}`
            return result

        } catch (e) {
            return `[Prisma] [DB : ${this.DB_NAME}] Error : ${e}`
        }
    }
}

export const GATEWAY_DB_CIMB = {
    DB_NAME: 'GATEWAY',
    DB: new DB_CLIENT_GATEWAY(),
    async GET_INIT (payload) {
        try {
            if (!!payload) {
                return await this.DB.coop_provide_cimb.findUnique({
                    where: {
                        coop_key: payload
                    }
                })
            } else throw "Payload not complete"
        } catch (e) {
            return `[Prisma] [DB : ${this.DB_NAME}] Error : ${e}`
        }
    },
    async GET_INIT_TO_CACHE () {
        try {
            return await this.DB.coop_provide_cimb.findMany()
        } catch (e) {
            return `[Prisma] [DB : ${this.DB_NAME}] Error : ${e}`
        }
    },
    async SET_LOG (payload) {
        try {
            const VALUES = {
                log_income : JSON.stringify(payload.log_income),
                trans_flag : payload.trans_flag,
                coop_key : payload.coop_key,
                sigma_key : payload.sigma_key,
                log_response : JSON.stringify(payload.log_response)
            }

            const result = await this.DB.$queryRaw`INSERT INTO logtranscimb
            (
                log_income,
                trans_flag,
                coop_key,
                sigma_key,
                log_response
            ) VALUES (
                ${VALUES.log_income},
                ${VALUES.trans_flag},
                ${VALUES.coop_key},
                ${VALUES.sigma_key},
                ${VALUES.log_response}
            )
            `
            return result
        } catch (error) {
            
        }
    },
    async GET_PAYER_KBANK (payload) {
        try {
            const result = await this.DB.$queryRaw`
                SELECT payer_account,pass_algo_nonbank,merchant_id
                FROM coop_provide_kbank
                WHERE 
            `
        } catch (error) {
            
        }
    }
}