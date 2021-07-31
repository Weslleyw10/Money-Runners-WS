const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Tracking = new Schema({
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
    operation: {
        type: String,
        enum: ['fee','gain','loss','withdral'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    transactionId: {
        type: String,
        required: [
            function () {
                return ['fee', 'withdral'].includes(this.operation)
            }
        ]
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

module.exports = mongoose.model('Tracking', Tracking)