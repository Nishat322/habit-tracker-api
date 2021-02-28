const path = require('path')
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
                    .location(path.posix.join(req.originalUrl + `/${habit.id}`))
                    .json(habit)
            })
            .catch(next)
    })

habitsRouter
    .route('/habits/:habit_id')
    .all((req,res,next) => {
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
                res.habit = habit
                next()
            })
            .catch(next)
    })
    .get((req,res,next) => {
        res.json({
            id: res.habit.id,
            title: xss(res.habit.title),
            description: xss(res.habit.description),
            motivation: xss(res.habit.motivation),
            date_added: res.habit.date_added,
            goal: res.habit.goal,
            days_completed: res.habit.days_completed
        })   
    })
    .delete((req,res,next) => {
        const {habit_id} = req.params
        const knexInstance = req.app.get('db')

        HabitsService.deleteHabit(knexInstance, habit_id)
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    }) 
    .patch(jsonParser, (req,res,next) => {
        const {title, description, motivation, goal} = req.body
        const habitToUpdate = {title, description, motivation, goal}
        const {habit_id} = req.params
        const knexInstance = req.app.get('db')

        const numberOfValues = Object.values(habitToUpdate).filter(Boolean).length
        if( numberOfValues === 0){
            return res
                .status(400)
                .json({error: {message: 'Request body must contain either \'title\', \'description\', \'motivation\', or \'goal\''}})
        }

        HabitsService.updateHabit(knexInstance, habit_id, habitToUpdate)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)

    })

module.exports = habitsRouter