import * as ainu from "#Utils/ainu.func"
import * as endpoint from "#constants/endpoints"
import { getDirName, getBaseOnDirName } from "#Utils/helper"
import { RequestFunction, genUUID } from "#Utils/utility.func"
import { HttpException } from "#Exceptions/HttpException"
import FormData from 'form-data'

export class AinuController {

    #mode = process.env.NODE_ENV

    faceQualityimageUploader(req, res) {
        let __dirname = getDirName(import.meta.url)
        __dirname = getBaseOnDirName(__dirname)
        res.status(200).sendFile(`${__dirname}/src/image.html`)
    }

    faceQuality = async (req, res, next) => {
        try {
            if (!req.file) return next(new HttpException(400, `Input image error`))

            const form = new FormData()
            const headers = {
                'X-Authorization': req.headers.Authorization,
                'X-Request-Id': genUUID(),
                ...form.getHeaders()
            }

            form.append('image',req.file.buffer,{
                filename : req.file.originalname
            })
            
            const url = `${endpoint.default.ainu[this.#mode]}${endpoint.default.ainu.endpoint.faceQuality}`
            const result = await RequestFunction.formData(false, url, headers, form, {})
            res.status(200).json(result.data)
        } catch (error) {
            next(error)
        }
    }
}