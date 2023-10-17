import jwt from "jsonwebtoken"
import secret_key from '#constants/key'
import { checkCompleteArgument, c_time, getLastPathSegment } from "#Utils/utility.func"
import { logger } from "#Utils/logger"

export const verifyInput = (req, res, next) => {
    if (checkCompleteArgument(['verify_token', 'app_id'], req.body)) {
        try {
            jwt.verify(req.body.verify_token, secret_key[req.body.app_id], (error, result) => {
                if (error) {
                    logger.error(`(JWT) ${error}`)
                    res.status(500).end(`[${c_time()}][Authorization] Error => Verify token Error`)
                }
                req.body = result
                req.body.routePath = getLastPathSegment(req.route.path) 
                next()
            })
        } catch (error) {
            logger.error(`(JWT) ${error}`)
            res.status(500).end(`[${c_time()}][Unthorization] Error => Verify token Error`)
        }
    } else {
        logger.error('Payload not compalte')
        res.status(500).end(`[${c_time()}][Unthorization] Error => Payload not compalte`)
    }
}
