const mongoose = require('mongoose')
const environment = process.env.ENVIRONMENT

let URI = ''

if(environment == 'dev') {
    URI = process.env.MONGO_URL_DEV
} else {
    URI = process.env.MONGO_URL_PROD    
}

mongoose.set('useNewUrlParser', true)
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)
mongoose.set('useUnifiedTopology', true)
mongoose.set('debug', true)

mongoose
    .connect(URI)
    .then(() => console.log(`DB is up. Environment ${environment}.`))
    .catch((err) => console.log(err))