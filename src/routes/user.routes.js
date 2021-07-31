const express = require('express')
const mongoose = require('mongoose')
const Busboy = require('busboy')
const bcrypt = require('bcrypt')
const moment = require('moment')

const aws = require('../services/aws.js')

const router = express.Router()

router.post('/', async(req, res) => {
    var busboy = new Busboy({ headers: req.headers })
    busboy.on('finish', async () => {
        try {
            const userId = mongoose.Types.ObjectId()
            let pathPhoto = ''

            // upload
            if(req.files) {
                const file = req.files.photo

                const nameParts = file.name.split('.')
                const fileName = `${userId}.${nameParts[nameParts.length-1]}`
                pathPhoto = `users/${fileName}`

                const response = await aws.uploadToS3(file, pathPhoto)

                if (response.error) {
                    res.json({
                        error: true,
                        message: response.message
                    })

                    return false
                }
            }

            // create user


            res.json({ error: false, message: "upload successful."})
        

        } catch (error) {
            res.json({ error: true, message: error.message})
        }
    })

    req.pipe(busboy)

})

module.exports = router