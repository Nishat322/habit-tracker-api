const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const { makeHabitsArray, makeMaliciousHabit } = require('./habits.fixtures')

describe('Habits Endpoints', function() {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('habits').truncate())

    afterEach('clean the table', () => db('habits').truncate())

    describe('GET /api/habits', () => {
        context('Given no habits', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/habits')
                    .expect(200, [])
            })
        })

        context('Given there are habits in the database', () => {
            const testHabits = makeHabitsArray()
    
            beforeEach('insert habits', () => {
                return db   
                    .into('habits')
                    .insert(testHabits)
            })
    
            it('GET /api/habits responds with 200 and all of the habits', () => {
                return supertest(app)
                    .get('/api/habits')
                    .expect(200, testHabits)
            })   
        })
    })
   
    describe('GET /api/habits/:habit_id', () => {
        context('Given there are habits in the database', () => {
            const testHabits = makeHabitsArray()

            beforeEach('insert habits', () => {
                return db   
                    .into('habits')
                    .insert(testHabits)
            })

            it('GET /api/habits/:habit_id responds with 200 and the specified habit', () => {
                const habitId = 2
                const expectedHabit = testHabits[habitId -1]
    
                return supertest(app)
                    .get(`/api/habits/${habitId}`)
                    .expect(200, expectedHabit)
            })
        })

        context('Given an XSS attack habit', () => {
            const maliciousHabit = makeMaliciousHabit()
            console.log(maliciousHabit)
            beforeEach('insert malicious habit', () => {
                return db 
                    .into('habits')
                    .insert(maliciousHabit)
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/habits/${maliciousHabit.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                        expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                        expect(res.body.motivation).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                    })
            })
        })

        context('Given no habits', () => {
            it('responds with 404', () => {
                const habitId = 123456
                
                return supertest(app)
                    .get(`/api/habits/${habitId}`)
                    .expect(404, {error: {message: 'Habit doesn\'t exist'}})
            })
        })
    })

    describe('POST /api/habits', () => {
        it('creates a habit, responding with 201 and the new habit', function () {
            const newHabit = {
                title: 'New Test Habit',
                description: 'New test habit description',
                motivation: 'New test habit motivation',
                goal: '23',
            }

            return supertest(app)
                .post('/api/habits')
                .send(newHabit)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newHabit.title)
                    expect(res.body.description).to.eql(newHabit.description)
                    expect(res.body.motivation).to.eql(newHabit.motivation)
                    expect(res.body.goal).to.eql(newHabit.goal)
                    expect(res.body).to.have.property('id')
                    expect(res.body).to.have.property('date_added')
                    expect(res.headers.location).to.eql(`/api/habits/${res.body.id}`)
                })
                .then(postRes =>
                    supertest(app)
                        .get(`/api/habits/${postRes.body.id}`)
                        .expect(postRes.body)
                    )
        })

        const requiredFields = ['title', 'description', 'goal']

        requiredFields.forEach(field => {
            const newHabit = {
                title: 'New Test Habit',
                description: 'New test habit description',
                motivation: 'New test habit motivation',
                goal: '23',
            }

            it(`responds with 400 and error message when the ${field} is missing`, () => {
                delete newHabit[field]

                return supertest(app)
                    .post('/api/habits')
                    .send(newHabit)
                    .expect(400, {error: {message: `Missing '${field}' in request body`}})
            })
        })
    })

    describe('DELETE /api/habits/:habit_id', () => {
        context('Given there are habits in the database', () => {
            const testHabits = makeHabitsArray()

            beforeEach('insert habits', () => {
                return db   
                    .into('habits')
                    .insert(testHabits)
            })

            it('responds with 204 and removes the article', () => {
                const idToRemove = 2
                const expectedHabits = testHabits.filter(habit => habit.id !== idToRemove)

                return supertest(app)
                    .delete(`/api/habits/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get('/api/habits')
                            .expect(expectedHabits)    
                    )
            })
        })

        context('Given no habits', () => {
            it('responds with 404', () => {
                const habitId = 123456

                return supertest(app)
                    .delete(`/api/habits/${habitId}`)
                    .expect(404, {error: {message: 'Habit doesn\'t exist'}})
            })
        })
    })

    describe.only('PATCH /api/habits/:habit_id', () => {
        context('Given no habits', () => {
            it('responds with 404', () => {
                const habitId = 123456

                return supertest(app)
                    .patch(`/api/habits/${habitId}`)
                    .expect(404, {error: {message: 'Habit doesn\'t exist'}})
            })
        })

        context('Given there are habits in the datatbase', () => {
            const testHabits = makeHabitsArray()

            beforeEach('insert habits', () => {
                return db   
                    .into('habits')
                    .insert(testHabits)
            })

            it('responds with 204 and updates the habit', () => {
                const idToUpdate = 2
                const updateHabit = {
                    title: 'Updated Habit',
                    description: 'Updated habit description',
                    motivation: 'Updated motivation',
                    goal: '5'
                }
                const expectedHabit = {
                    ...testHabits[idToUpdate - 1],
                    ...updateHabit
                }

                return supertest(app)
                    .patch(`/api/habits/${idToUpdate}`)
                    .send(updateHabit)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/habits/${idToUpdate}`)
                            .expect(expectedHabit)    
                    )
            })

            it('responds with 400 when no required fields supplied', () => {
                const idToUpdate = 3
                return supertest(app)
                    .patch(`/api/habits/${idToUpdate}`)
                    .send({irrelavntField: 'foo'})
                    .expect(400, {error: {message:'Request body must contain either \'title\', \'description\', \'motivation\', or \'goal\''}})
            })

            it('responds with 204 when updating only a subset of fields', () => {
                const idToUpdate = 2
                const updateHabit = {
                    title: 'Updated habit title'
                }
                const expectedHabit = {
                    ...testHabits[idToUpdate - 1],
                    ...updateHabit
                }

                return supertest(app)
                    .patch(`/api/habits/${idToUpdate}`)
                    .send({
                        ...updateHabit,
                        fieldToIgnore: 'should not be in the GET response'
                    })
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/habits/${idToUpdate}`)
                            .expect(expectedHabit)
                    )
            })
        })
    })
    
})