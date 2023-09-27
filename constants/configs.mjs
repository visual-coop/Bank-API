export default {
    MODE : 'PROD', // PROD , UAT
    CONFIG_EXTERNAL : "https://coopdirect.thaicoop.co/coopdirect-test/config/config_external.json",
    BANK_API_PATH : 'http://gatewaydirect.thaicoop.co/coopdirect/config/config_bankurl.json',
    BANK_API_PATH_SELECT : [
        'oAuthTokenV2CIMB',
        'inquiryAccountV2CIMB',
        'confirmFunsTransferV2CIMB',
        'getStatusV2CIMB'
    ],

    api_port : 10003,

    // DB
    redis: {
        host: 'redis', // Change to 'redis' on Docker
        port: 6379,
        //password: 'Fs#5132Xcza'
    }
}
