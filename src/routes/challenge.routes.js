const express = require('express')
const mongoose = require('mongoose')
const Busboy = require('busboy')
const bcrypt = require('bcrypt')
const moment = require('moment')
const lodash = require('lodash')

// services
const aws = require('../services/aws')
const pagarme = require('../services/pagarme')

// models
const User = require('../models/user')
const Challenge = require('../models/challenge')
const Tracking = require('../models/tracking')
const userChallenge = require('../models/relationship/userChallenge')

// utils
const util = require('../utils')

const router = express.Router()

router.post('/', async (req, res) => {
    try {
        const challenge = await new Challenge(req.body).save()
        res.json({ error: false, challenge})
        
    } catch (error) {
        res.json({ error: true, message: error.message})
    }
})

router.post('/join', async (req, res) => {
    try {
        const { userId, challengeId, creditCard } = req.body

        // Get User & Challenge
        const user = await User.findById(userId)
        const challenge = await Challenge.findById(challengeId)
        const challengePrice =  util.toCents(challenge.fee)

        // Create transaction
        const transaction = await pagarme('transactions', {
            amount: challengePrice,
            ...creditCard,
            customer: {
                id: user.externalId
            },
            billing: {
                "name": "Trinity Moss",
                "address": {
                    "country": "br",
                    "state": "sp",
                    "city": "Cotia",
                    "neighborhood": "Rio Cotia",
                    "street": "Rua Matrix",
                    "street_number": "9999",
                    "zipcode": "06714360"
                }
            },
            items: [
                {
                    id: challenge._id,
                    title: challenge.title,
                    unit_price: challengePrice,
                    quantity: 1,
                    tangible: false
                }
            ]

        })

        if(transaction.error) {
            throw transaction
        }

        // create tracking
        await new Tracking({
            userId,
            challengeId,
            operation: 'fee',
            transactionId: transaction.data.id,
            amount: challenge.fee
        }).save()
        
        // user & challenge relationship
        await new userChallenge({
            userId,
            challengeId
        }).save()


        res.json({ error: false })

    } catch (error) {
        res.json({ error: true, message: error.message })
    }
})

router.post('/tracking', async (req, res) => {
    try {
        const { userId, challengeId, operation } = req.body
        const existentTrackingType = await Tracking.findOne({
            userId,
            challengeId,
            operation,
            createdAt: {
                $lte: moment().endOf('day'),
                $gte: moment().startOf('day')
            }
        })

        if (!existentTrackingType) {
            const tracking = await new Tracking(req.body).save()
        }
        
        res.json({ error: false })
        // res.json({ error: false, message: 'The operation has already been carried out today.' })

    } catch (error) {
        res.json({ error: true, message: error.message })
    }
})

router.get('/:challengeId/ranking', async (req, res) => {
    try {
        const { challengeId } = req.params
        const challenge = await Challenge.findById(challengeId)

        // current and total period
        const dayStart = moment(challenge.date.start, 'YYYY-MM-DD')
        const dayEnd = moment(challenge.date.end, 'YYYY-MM-DD')
        const challengePeriod = dayEnd.diff(dayStart, 'days')
        const currentPeriod = moment().diff(dayStart.subtract(1, 'day'), 'days')

        const trackings = await Tracking.find({
            challengeId,
            operation: ['gain', 'loss']
        }).populate('userId', 'name photo')

        const trackingByUser = lodash.chain(trackings).
        groupBy('userId._id')
        .toArray()
        .map(trackingUser => ({
            _id: trackingUser[0].userId._id,
            name: trackingUser[0].userId.name,
            photo: trackingUser[0].userId.photo,
            performance: trackingUser.filter(tracking => tracking.operation === 'gain').length
        })).orderBy('performance', 'desc')

        const extraBalance = trackings
            .filter(tracking => tracking.operation === 'loss')
            .reduce((total, tracking) => {
                return total + tracking.amount
            }, 0)


        res.json({ 
            error: false,
            challengeData: challenge.data,
            currentPeriod,
            challengePeriod,
            trackingByUser,
            extraBalance
        })

    } catch (error) {
        res.json({ error: true, message: error.message})
    }
})

// router.post('/login', async (req, res) => {
//     try {

        // res.json({ error: false })

//     } catch (error) {
//         res.json({ error: true, message: error.message})
//     }
// })



module.exports = router