import Redis from 'ioredis'
import { promisify } from 'util'
import { createPool } from "mysql2/promise"
import { c_time } from '#Utils/utility.func'
import configs from '#constants/configs'

export class DBConnection {

    mysql = createPool({ ...configs[process.env.NODE_ENV].mysqlPool })

} 