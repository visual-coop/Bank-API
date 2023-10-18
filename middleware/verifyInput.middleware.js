import { checkCompleteArgument, c_time, getLastPathSegment } from "#Utils/utility.func"
import { HttpException } from "#Exceptions/HttpException"
import jwt from "jsonwebtoken"
import secret_key from '#constants/key'

export const verifyInput = (req, res, next) => {
    if (checkCompleteArgument(['verify_token', 'app_id'], req.body)) {
        try {
            jwt.verify(req.body.verify_token, secret_key[req.body.app_id], (error, result) => {
                if (error) next(new HttpException(401, `Verify input error ${error}`))
                req.body = result
                req.body.routePath = getLastPathSegment(req.route.path) 
                next()
            })
        } catch (error) {
            next(new HttpException(401, `Verify input error ${error}`))
        }
    } else {
        next(new HttpException(404, `Verify input error. Payload not complete`))
    }
}
