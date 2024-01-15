import { logger } from '#Utils/logger'

export const ErrorMiddleware = (error, req, res, next) => {
  try {
    const status = error.status || 500
    const message = error || 'Something went wrong'

    logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${JSON.stringify(message)}`)
    const payload = {
        message : message,
        RESULT : false
    }
    res.status(status).json(payload)
  } catch (error) {
    next(error)
  }
}
