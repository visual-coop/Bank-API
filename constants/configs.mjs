export default {
    MODE : 'UAT', // PROD , UAT
    CONFIG_EXTERNAL : "https://coopdirect.thaicoop.co/coopdirect-test/config/config_external.json",
    BANK_API_PATH : 'http://gatewaydirect.thaicoop.co/coopdirect/config/config_bankurl.json',
    BANK_API_PATH_SELECT : [
        'oAuthTokenV2CIMB',
        'inquiryAccountV2CIMB',
        'confirmFunsTransferV2CIMB',
        'getStatusV2CIMB'
    ],

    api_port : 10003,
    
    dev : {
        // DATABASE
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
        // DATABASE
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
