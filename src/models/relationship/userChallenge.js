const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userChallenge = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    challengeId: {
        type: mongoose.Types.ObjectId,
        ref: 'Challenge',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pendent'],
        default: 'active'
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

module.exports = mongoose.model('userChallenge', userChallenge)