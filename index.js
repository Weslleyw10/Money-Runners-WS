require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const busboy = require('connect-busboy')
const busboyBodyParser = require('busboy-body-parser')

const userRoutes = require('./src/routes/user.routes')

const environment = process.env.ENVIRONMENT

const app = express()

app.use(morgan(environment))
app.use(express.json())
app.use(busboy())
app.use(busboyBodyParser())
app.use(cors())

app.use('/user', userRoutes)

app.listen(8000 , () => {
    console.log(`Server is up in environment ${environment}.`)
})