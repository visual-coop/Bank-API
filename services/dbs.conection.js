import { createPool } from "mysql2/promise"
import configs from '#constants/configs'

export class DBConnection {

    mysql = createPool({ ...configs[process.env.NODE_ENV].mysqlPool })

} 