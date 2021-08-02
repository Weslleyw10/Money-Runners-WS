const express = require('express')
const mongoose = require('mongoose')
const Busboy = require('busboy')
const bcrypt = require('bcrypt')
const moment = require('moment')

// services
const aws = require('../services/aws')
const pagarme = require('../services/pagarme')

// models
const User = require('../models/user')
const Tracking = require('../models/tracking')
const Challenge = require('../models/challenge')
const UserChallenge = require('../models/relationship/userChallenge')
const userChallenge = require('../models/relationship/userChallenge')

const router = express.Router()

router.post('/', async (req, res) => {
    var busboy = new Busboy({ headers: req.headers })
    busboy.on('finish', async () => {
        try {
            const userId = mongoose.Types.ObjectId()
            let pathPhoto = ''

            // upload
            if (req.files) {
                const file = req.files.photo

                const nameParts = file.name.split('.')
                const fileName = `${userId}.${nameParts[nameParts.length - 1]}`
                pathPhoto = `users/${fileName}`

                const response = await aws.uploadToS3(file, pathPhoto)

                if (response.error) {
                    throw response.message
                }
            }

            // create user
            const password = await bcrypt.hash(req.body.password, 10)

            const user = await new User({
                ...req.body,
                password,
                photo: pathPhoto,
                _id: userId
            }).save()

            res.json({ error: false, user: user })

        } catch (error) {
            res.json({ error: true, message: error.message })
        }
    })

    req.pipe(busboy)

})

router.post('/login', async (req, res) => {
    try {
        const { password, email } = req.body
        const user = await User.findOne({
            email,
            status: 'active'
        })

        if (!user) {
            throw new Error('User not found.')
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            throw new Error('User or password is invalid.')
        }

        res.json({ user })

    } catch (error) {
        res.json({ error: true, message: error.message })
    }
})

router.put('/:userId/accept', async (req, res) => {
    try {
        const { userId } = req.params
        let user = await User.findById(userId)

        const pargamerUser = await pagarme('/customers', {
            external_id: user._id,
            name: user.name,
            type: 'individual',
            country: 'br',
            email: user.email,
            documents: [
                {
                    type: "cpf",
                    number: user.document
                }
            ],
            phone_numbers: [`+55${user.phone}`],
            birthday: user.birthday
        })

        if (pargamerUser.error) {
            throw pargamerUser
        }

        user = await User.findByIdAndUpdate(userId, {
            status: 'active',
            externalId: pargamerUser.data.id,
            updatedAt: Date.now()
        })

        res.json({ error: false, user })



    } catch (error) {
        res.json({ error: true, message: error.message })
    }
})

router.get('/:userId/challenge', async (req, res) => {
    try {

        const { userId } = req.params

        // get current challenge
        const challenge = await Challenge.findOne({
            status: 'active'
        })

        if (!challenge) {
            throw new Error('Challenge not found.')
        }

        // check if the user is participating in the challenge
        const userChallengeRelationship = await UserChallenge.findOne({
            userId,
            challengeId: challenge._id
        })

        // total and current period of the challenge
        const dayStart = moment(challenge.date.start, 'YYYY-MM-DD')
        const dayEnd = moment(challenge.date.end, 'YYYY-MM-DD')
        const challengePeriod = dayEnd.diff(dayStart, 'days')
        const currentPeriod = moment().diff(dayStart.subtract(1, 'day'), 'days')

        // fee daily
        const dailyAmount = (challenge.fee / challengePeriod).toFixed(2)

        // number of participations
        const participatedTimes = await Tracking.find({
            operation: 'gain',
            userId,
            challengeId: challenge._id
        })

        // balance achieved
        const balance = participatedTimes?.length * dailyAmount

        // check if you took the challenge today
        const challengeFinishedToday = await Tracking.findOne({
            userId,
            challengeId: challenge._id,
            operation: {
                $in: ['gain', 'loss']
            },
            createdAt: {
                $lte: moment().endOf('day'),
                $gte: moment().startOf('day')
            }
        })

        // calculate discipline
        const periodDiscipline = Boolean(challengeFinishedToday)
            ? currentPeriod
            : currentPeriod - 1
        const discipline = (participatedTimes?.length / periodDiscipline) || 0

        // results today
        const dailyResults = await Tracking.find({
            challengeId: challenge._id,
            operation: {
                $in: ['gain', 'loss']
            },
            createdAt: {
                $lte: moment().endOf('day'),
                $gte: moment().startOf('day')
            }
        }).populate('userId', 'name photo')
            .select('userId amount operation')

        res.json({
            error: false,
            challenge,
            challengePeriod,
            currentPeriod,
            dailyAmount,
            participatedTimes: participatedTimes?.length,
            isParticipating: Boolean(userChallenge),
            balance,
            challengeFinishedToday: Boolean(challengeFinishedToday),
            discipline,
            dailyResults
        })

    } catch (error) {
        res.json({ error: true, message: error.message })
    }
})

router.get('/:userId/balance', async (req, res) => {
    try {
        const { userId } = req.params
        const records = await Tracking.find({
            userId
        }).sort([['createdAt', -1]])

        const balance = records.filter(item => item.operation === 'gain')
        .reduce((total, item) => {
            return total + item.amount
        }, 0)

        res.json({ error: false, records, balance })

    } catch (error) {
        res.json({ error: true, message: error.message})
    }
})

// router.post('/login', async (req, res) => {
//     try {

//     } catch (error) {
//         res.json({ error: true, message: error.message})
//     }
// })


module.exports = router