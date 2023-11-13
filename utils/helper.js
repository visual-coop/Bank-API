import path from 'path'
import { fileURLToPath } from 'url'

export const getDirName = (moduleUrl) => {
    const filename = fileURLToPath(moduleUrl)
    return path.dirname(filename)
}

export const getBaseOnDirName = (moduleUrl) => {
    return path.dirname(moduleUrl)
}