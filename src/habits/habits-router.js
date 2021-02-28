const express = require('express')
const HabitsService = require('./habits-service')
const logger = require('../logger')

const habitsRouter = express.Router()
const jsonParser = express.json()

habitsRouter
    .route('/habits')
    .get((req,res,next) => {
        const knexInstance = req.app.get('db')
    
        HabitsService.getAllHabits(knexInstance)
            .then(habits => {
                res.json(habits)
            })
            .catch(next)
    })
    .post(jsonParser, (req,res,next) => {
        const {title, description, motivation, goal} = req.body
        const newHabit = {title, description, motivation, goal}
        const knexInstance = req.app.get('db')

        HabitsService.insertHabit(knexInstance, newHabit)
            .then(habit => {
                res 
                    .status(201)
                    .location(`/habits/${habit.id}`)
                    .json(habit)
            })
            .catch(next)
    })

habitsRouter
    .route('/habits/:habit_id')
    .get((req,res,next) => {
        const knexInstance = req.app.get('db')
        const {habit_id} = req.params
        
        HabitsService.getById(knexInstance, habit_id)
            .then(habit => {
                if(!habit) {
                    logger.error(`Habit with ${habit_id} not found.`)
                    return res.status(404).json({
                        error: {message: 'Habit doesn\'t exist'}
                    })
                }
                res.json(habit)
            })
            .catch(next)
    })

module.exports = habitsRouter