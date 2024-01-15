import { createPool } from "mysql2/promise"
import configs from '#constants/configs'
import { HttpException } from "#Exceptions/HttpException"
import { logger } from "#Utils/logger"

export class DBConnection {

    mysql = createPool({ ...configs[process.env.NODE_ENV].mysqlPool })


    /**
     * 
     * @param {*} init Check on starting
     * @returns 
     */
    checkDBConnection = async (init) => {
        try {
            const connection = await this.mysql.getConnection()
            connection.release()
            if (init) logger.info(`Database Connected on => ${configs[process.env.NODE_ENV].mysqlPool.host}`)
            return true
        } catch (error) {
            return new HttpException(500, `Database connection server error ${err}`)
        }
    }
} 