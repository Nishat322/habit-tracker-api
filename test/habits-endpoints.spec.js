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

    describe('GET /habits', () => {
        context('Given no habits', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/habits')
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
    
            it('GET /habits responds with 200 and all of the habits', () => {
                return supertest(app)
                    .get('/habits')
                    .expect(200, testHabits)
            })   
        })
    })
   
    describe('GET /habits/:habit_id', () => {
        context('Given there are habits in the database', () => {
            const testHabits = makeHabitsArray()

            beforeEach('insert habits', () => {
                return db   
                    .into('habits')
                    .insert(testHabits)
            })

            it('GET /habits/:habit_id responds with 200 and the specified habit', () => {
                const habitId = 2
                const expectedHabit = testHabits[habitId -1]
    
                return supertest(app)
                    .get(`/habits/${habitId}`)
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
                    .get(`/habits/${maliciousHabit.id}`)
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
                    .get(`/habits/${habitId}`)
                    .expect(404, {error: {message: 'Habit doesn\'t exist'}})
            })
        })
    })

    describe('POST /habits', () => {
        it('creates a habit, responding with 201 and the new habit', function () {
            const newHabit = {
                title: 'New Test Habit',
                description: 'New test habit description',
                motivation: 'New test habit motivation',
                goal: '23',
            }

            return supertest(app)
                .post('/habits')
                .send(newHabit)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newHabit.title)
                    expect(res.body.description).to.eql(newHabit.description)
                    expect(res.body.motivation).to.eql(newHabit.motivation)
                    expect(res.body.goal).to.eql(newHabit.goal)
                    expect(res.body).to.have.property('id')
                    expect(res.body).to.have.property('date_added')
                    expect(res.headers.location).to.eql(`/habits/${res.body.id}`)
                })
                .then(postRes =>
                    supertest(app)
                        .get(`/habits/${postRes.body.id}`)
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
                    .post('/habits')
                    .send(newHabit)
                    .expect(400, {error: {message: `Missing '${field}' in request body`}})
            })
        })
    })

    describe.only('DELETE /habits/:habit_id', () => {
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
                    .delete(`/habits/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get('/habits')
                            .expect(expectedHabits)    
                    )
            })
        })

        context('Given no habits', () => {
            it('responds with 404', () => {
                const habitId = 123456

                return supertest(app)
                    .delete(`/habits/${habitId}`)
                    .expect(404, {error: {message: 'Habit doesn\'t exist'}})
            })
        })
    })
})