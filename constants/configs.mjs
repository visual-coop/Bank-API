export default {
    SERVER_PORT : 10003,
    
    dev : {
        LOG_FORMAT : 'dev',
        redis: {
            host: 'localhost',
            port: 6379,
            password: 'Fs#5132Xcza'
        },
        mysqlPool : {
            host : "172.31.42.156",
            port : 3306,
            user : "root",
            password : "@Gensoft2018",
            database : "api-uat",
            waitForConnections : true,
            connectionLimit : 10,
            queueLimit : 0
        },
    },
    prod : {
        LOG_FORMAT : 'combined',
        redis: {
            host: 'localhost',
            port: 6379,
            password: 'Fs#5132Xcza'
        },
        mysqlPool : {
            host : "172.31.42.156",
            port : 3306,
            user : "root",
            password : "@Gensoft2018",
            database : "api",
            waitForConnections : true,
            connectionLimit : 10,
            queueLimit : 0
        },
    }
}
