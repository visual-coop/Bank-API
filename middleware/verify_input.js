import jwt from "jsonwebtoken"
import * as lib from "#libs/Functions"
import secret_key from '#constants/key'

export const decodedJWT = (req, res, next) => {
    if (lib.checkCompleteArgument(['verify_token', 'app_id'], req.body)) {
        try {
            jwt.verify(req.body.verify_token, secret_key[req.body.app_id], (err, result) => {
                if (err) {
                    console.error(`[${lib.c_time()}][Authorization] Error => Verify token Error`)
                    res.status(500).end(`[${lib.c_time()}][Authorization] Error => Verify token Error`)
                }

                req.body = result
                next()
            })
        } catch (e) {
            console.error(`[${lib.c_time()}][Authorization] Error => Verify token Error`)
            res.status(500).end(`[${lib.c_time()}][Authorization] Error => Verify token Error`)
        }
    } else {
        console.error(`[${lib.c_time()}][Authorization] Error => Payload not compalte`)
        res.status(500).end(`[${lib.c_time()}][Authorization] Error => Payload not compalte`)
    }
}