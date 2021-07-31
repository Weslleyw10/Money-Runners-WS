const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Challenge = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    fee: {
        type: String,
        required: true
    },
    distance: {
        type: String,
        required: true
    },
    date: {
        start: {
            type: String,
            required: true
        },
        end: {
            type: String,
            required: true
        }
    },
    time: {
        start: {
            type: String,
            required: true
        },
        end: {
            type: String,
            required: true
        }
    },
    video: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pendent'],
        default: 'pendent'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: null
    },
})

module.exports = mongoose.model('Challenge', Challenge)