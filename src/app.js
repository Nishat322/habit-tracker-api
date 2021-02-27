require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const HabitsService = require('./habits/habits-service')

const app = express()

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
app.use(cors())
app.use(helmet())

app.get('/habits', (req,res,next) => {
    const knexInstance = req.app.get('db')
    HabitsService.getAllHabits(knexInstance)
        .then(habits => {
            res.json(habits)
        })
        .catch(next)
})

app.get('/habits/:habit_id', (req,res,next) => {
    const knexInstance = req.app.get('db')
    const {habit_id} = req.params
    HabitsService.getById(knexInstance, habit_id)
        .then(habit => {
            if(!habit) {
                return res.status(404).json({
                    error: {message: 'Habit doesn\'t exist'}
                })
            }
            res.json(habit)
        })
        .catch(next)
})

app.get('/', (req, res) => {
    res.send('Hello, world!')
})

app.use(function errorHandler(error, req, res, next) {
    let response
    if (NODE_ENV === 'production') {
        response = { error: { message: 'server error' } }
    } else {
        console.error(error)
        response = { message: error.message, error }
    }
    res.status(500).json(response)
})
    
module.exports = app