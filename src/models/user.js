const mongoose = require('mongoose')
const Schema = mongoose.Schema

const User = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    photo: {
        type: String,
    },
    document: {
        type: String,
    },
    birthday: {
        type: String,
    },
    externalId: {
        type: String,
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

module.exports = mongoose.model('User', User)