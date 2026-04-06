import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'

const imagesDir = 'public/images/'
const audioDir = 'public/audio/'

fs.mkdirSync(path.resolve(imagesDir), { recursive: true })
fs.mkdirSync(path.resolve(audioDir), { recursive: true })

const imageStorage = multer.diskStorage({
    destination: function (req: any, file: any, cb: any) {
        cb(null, imagesDir)
    },
    filename: function (req: any, file: any, cb: any) {
        const uniqueName = Date.now() + '-' + file.originalname
        cb(null, uniqueName)
    }
})

const audioStorage = multer.diskStorage({
    destination: function (req: any, file: any, cb: any) {
        cb(null, audioDir)
    },
    filename: function (req: any, file: any, cb: any) {
        const uniqueName = Date.now() + '-' + file.originalname
        cb(null, uniqueName)
    }
})

const audioFileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
    const allowedMimes = new Set([
        'audio/webm',
        'audio/ogg',
        'audio/mpeg',
        'audio/mp4',
        'audio/wav',
        'audio/x-wav',
    ])

    if (!allowedMimes.has(file.mimetype)) {
        cb(new Error('Unsupported audio format'))
        return
    }

    cb(null, true)
}

export const upload = multer({ storage: imageStorage })

export const uploadAudio = multer({
    storage: audioStorage,
    fileFilter: audioFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
})