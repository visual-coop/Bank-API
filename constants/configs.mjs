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
            host : "43.229.79.117",
            port : 3307,
            user : "root",
            password : "@Egat2020",
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
            host : "43.229.79.117",
            port : 3307,
            user : "root",
            password : "@Egat2020",
            database : "api",
            waitForConnections : true,
            connectionLimit : 10,
            queueLimit : 0
        },
    }
}
