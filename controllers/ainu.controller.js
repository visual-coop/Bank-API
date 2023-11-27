import * as ainu from "#Utils/ainu.func"
import * as endpoint from "#constants/endpoints"
import { getDirName, getBaseOnDirName } from "#Utils/helper"
import { RequestFunction, genUUID } from "#Utils/utility.func"
import { HttpException } from "#Exceptions/HttpException"
import FormData from 'form-data'

export class AinuController {

    #IMGTYPE_SUPPORT = [
        'image/jpeg',
        'image/jpg',
        'image/png'
    ]

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

    faceCompare = async (req, res, next) => {
        try {
            if (!req.files) return next(new HttpException(400, `Input image error`))

            const form = new FormData()
            const headers = {
                'X-Authorization': req.headers.Authorization,
                'X-Request-Id': genUUID(),
                ...form.getHeaders()
            }

            form.append('image1',req.files.image1[0].buffer,{
                filename : req.files.image1[0].originalname
            })

            form.append('image2',req.files.image2[0].buffer,{
                filename : req.files.image2[0].originalname
            })
            form.append("compareMode", req.body.compareMode)
            form.append("checkQualityImage1", req.body.checkQualityImage1 ?? false)
            form.append("checkQualityImage2", req.body.checkQualityImage2 ?? false)
            const url = `${endpoint.default.ainu[this.#mode]}${endpoint.default.ainu.endpoint.faceCompare}`
            const result = await RequestFunction.formData(false, url, headers, form, {})
            res.status(200).json(result.data)
        } catch (error) {
            next(error)
        }
    }

    thaiIDFront = async (req, res, next) => {
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
            
            const url = `${endpoint.default.ainu[this.#mode]}${endpoint.default.ainu.endpoint.thaiIDFront}`
            const result = await RequestFunction.formData(false, url, headers, form, {})
            res.status(200).json(result.data)
        } catch (error) {
            next(error)
        }
    }

    thaiIDBack = async (req, res, next) => {
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
            
            const url = `${endpoint.default.ainu[this.#mode]}${endpoint.default.ainu.endpoint.thaiIDBack}`
            const result = await RequestFunction.formData(false, url, headers, form, {})
            res.status(200).json(result.data)
        } catch (error) {
            next(error)
        }
    }

    thaiIDPortrait = async (req, res, next) => {
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
            
            const url = `${endpoint.default.ainu[this.#mode]}${endpoint.default.ainu.endpoint.thaiIDPortrait}`
            const result = await RequestFunction.formData(false, url, headers, form, {})
            res.status(200).json(result.data)
        } catch (error) {
            next(error)
        }
    }
}