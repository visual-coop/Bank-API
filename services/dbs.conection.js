import { createPool } from "mysql2/promise"
import Client from 'ssh2-sftp-client'
import configs from '#constants/configs'
import { HttpException } from "#Exceptions/HttpException"
import { logger } from "#Utils/logger"

export class DBConnection {

    mysql = createPool({ ...configs[process.env.NODE_ENV].mysqlPool })

    checkDBConnection = async (onStart) => {
        try {
            const connection = await this.mysql.getConnection()
            connection.release()
            if (onStart) logger.info(`Database Connected on => ${configs[process.env.NODE_ENV].mysqlPool.host}`)
            return true
        } catch (error) {
            return new HttpException(500, `Database connection server error ${error}`)
        }
    }

    Sftp = async () => {
        try {
            const sftp = new Client()
            await sftp.connect(configs[process.env.NODE_ENV].sftp)
            return sftp
        } catch (error) {
            return new HttpException(500, `Sftp connection error ${error}`)
        }
    }
} 