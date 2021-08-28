require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const busboy = require('connect-busboy')
const busboyBodyParser = require('busboy-body-parser')

const app = express()

// ENVIRONMENT
const environment = process.env.ENVIRONMENT

// DATABASE
require('./database')

// MIDDLEWARES
app.use(morgan(environment))
app.use(express.json())
app.use(busboy())
app.use(busboyBodyParser())
app.use(cors())

// ROUTES
app.use('/user', require('./src/routes/user.routes'))
app.use('/challenge', require('./src/routes/challenge.routes'))

app.listen(process.env.PORT || 8000 , () => {
    console.log(`Server is up in environment ${environment}.`)
})