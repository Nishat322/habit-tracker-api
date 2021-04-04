const path = require('path')
const express = require('express')
const xss = require('xss')
const AccomplishmentsService = require('./accomplishments-service')
const logger = require('../logger')

const accomplishmentsRouter = express.Router()
const jsonParser = express.json()

accomplishmentsRouter
    .route('/accomplishments')
    .get((req,res,next) => {
        const knexInstance = req.app.get('db')
    
        AccomplishmentsService.getAllAccomplishments(knexInstance)
            .then(accomplishments => {
                res.json(accomplishments)
            })
            .catch(next)
    })
    .post(jsonParser, (req,res,next) => {
        const {title, description} = req.body
        const newAccomplishment = {title, description}
        const knexInstance = req.app.get('db')

        for(const [key, value] of Object.entries(newAccomplishment)){
            if(value == null){
                logger.error(`${key} is required`)
                return res
                    .status(400)
                    .json({error: {message: `Missing '${key}' in request body`}})
            }
        }

        AccomplishmentsService.insertAccomplishment(knexInstance, newAccomplishment)
            .then(accomplishment => {
                res 
                    .status(201)
                    .location(path.posix.join(req.originalUrl + `/${accomplishment.id}`))
                    .json(accomplishment)
            })
            .catch(next)
    })

accomplishmentsRouter
    .route('/accomplishments/:accomplishment_id')
    .all((req,res,next) => {
        const knexInstance = req.app.get('db')
        const {accomplishment_id} = req.params
        
        AccomplishmentsService.getById(knexInstance, accomplishment_id)
            .then(accomplishment => {
                if(!accomplishment) {
                    logger.error(`Accomplishment with ${accomplishment_id} not found.`)
                    return res.status(404).json({
                        error: {message: 'Accomplishment doesn\'t exist'}
                    })
                }
                res.accomplishment = accomplishment
                next()
            })
            .catch(next)
    })
    .get((req,res,next) => {
        res.json({
            id: res.accomplishment.id,
            title: xss(res.accomplishment.title),
            description: xss(res.accomplishment.description),
            date_added: res.accomplishment.date_added,
        })   
    })
    .delete((req,res,next) => {
        const {accomplishment_id} = req.params
        const knexInstance = req.app.get('db')

        AccomplishmentsService.deleteAccomplishment(knexInstance, accomplishment_id)
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    }) 

module.exports = accomplishmentsRouter