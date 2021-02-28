const express = require('express')
const xss = require('xss')
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
        const newHabit = {title, description, goal}
        const knexInstance = req.app.get('db')

        for(const [key, value] of Object.entries(newHabit)){
            if(value == null){
                logger.error(`${key} is required`)
                return res
                    .status(400)
                    .json({error: {message: `Missing '${key}' in request body`}})
            }
        }

        newHabit.motivation = motivation

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
                res.json({
                    id: habit.id,
                    title: xss(habit.title),
                    description: xss(habit.description),
                    motivation: xss(habit.motivation),
                    date_added: habit.date_added,
                    goal: habit.goal,
                    days_completed: habit.days_completed
                })
            })
            .catch(next)
    })

module.exports = habitsRouter