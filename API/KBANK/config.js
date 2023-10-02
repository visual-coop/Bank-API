const header = {
    bank_name: "KBANK",
    bank_code: "004",
    // ? Credentials for Sandbox
    credentials: {
        sandbox: {
            consumer_id: "OO1KnihSPudQzLxxky4zt6ekNApho4lK",
            consumer_secret: "w7vvikhFZhVxxPrl"
        },
        dev: {
            consumer_id: "NcS1V4JDPaFF5OF0xuCqhpY8jaoK9nnt",
            consumer_secret: "NXGYd1iG2j7vlLNe"
        }
    }
}

export const config_kbank_v2 = {
    ...header
}
