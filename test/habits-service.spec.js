const { expect } = require("chai")
const knex = require('knex')
const HabitsService = require('../src/habits/habits-service')
const {makeHabitsArray} = require('./habits.fixtures')

describe('Habits Service Object', function() {
    let db
    let testHabits = makeHabitsArray()

    before(() => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
    })

    before(() => db('habits').truncate())

    afterEach(() => db('habits').truncate())

    after(() => db.destroy())
    
    context('Given \'habits\' has data', () => {
        before(() => {
            return db 
                .into('habits')
                .insert(testHabits)
        })

        it('getAllHabits() resolves all habits from \'habits\' table', () => {
            return HabitsService.getAllHabits(db)
                .then(actual => {
                    expect(actual).to.eql(testHabits.map(habit => ({
                        ...habit,
                        date_added: new Date(habit.date_added)
                    })))
                })
        })
    })

    context('Given \'habits\' has no data', () => {
        it('getAllHabits() resolves an empty array', () => {
            return HabitsService.getAllHabits(db)
                .then(actual => {
                    expect(actual).to.eql([])
                })
        })
    })
})