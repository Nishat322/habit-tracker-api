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
        beforeEach(() => {
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

        it('getById() resolves a habit by id from \'habits\' table', () => {
            const thirdId = 3
            const thirdTestHabit = testHabits[thirdId -1]

            return HabitsService.getById(db, thirdId)
                .then(actual => {
                    expect(actual).to.eql({
                        id: thirdId,
                        title: thirdTestHabit.title,
                        description: thirdTestHabit.description,
                        motivation: thirdTestHabit.motivation,
                        date_added: thirdTestHabit.date_added,
                        goal: thirdTestHabit.goal,
                        days_completed: thirdTestHabit.days_completed
                    })
                })
        })

        it('deleteHabit() removes a habit by id from \'habits\'', () => {
            const habitId = 3

            return HabitsService.deleteHabit(db, habitId)
                .then(() => HabitsService.getAllHabits(db))
                .then(allHabits => {
                    const expected = testHabits.filter(habit => habit.id !== habitId)
                    expect(allHabits).to.eql(expected)
                })
        })

        it('updateHabit() updates a habit from the \'habits\' table', () => {
            const idOfHabitToUpdate = 3
            const newHabitData = {
                title: 'Updated Habit Title',
                description: 'Updated habit description',
                motivation: 'updated motivation',
            }

            return HabitsService.updateHabit(db, idOfHabitToUpdate, newHabitData)
                .then(() => HabitsService.getById(db, idOfHabitToUpdate))
                .then(habit => {
                    expect(habit).to.eql({
                        id: idOfHabitToUpdate,
                        goal: testHabits[idOfHabitToUpdate - 1].goal,
                        date_added: testHabits[idOfHabitToUpdate -1].date_added,
                        days_completed: testHabits[idOfHabitToUpdate -1].days_completed,
                        ... newHabitData,
                        
                    })
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

        it('insertHabit() inserts a new habit and resolves the new habit with an id', () => {
            const newHabit = {
                title: 'Test New Habit',
                description: 'Some new test description',
                date_added: new Date('2020-01-01T00:00:00.000Z'),
                goal: '20',
            }

            return HabitsService.insertHabit(db, newHabit)
                .then(actual => {
                    expect(actual).to.eql({
                        id: 1,
                        title: newHabit.title,
                        description: newHabit.description,
                        motivation: 'You are doing so well!',
                        date_added: newHabit.date_added,
                        goal: newHabit.goal,
                        days_completed: null
                    })
                })  
        })
        
    })
})