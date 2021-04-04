//const { makeAccomplishmentsArray, makeMaliciousAccomplishment } = require('./habits.fixtures')

const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const {makeAccomplishmentsArray, makeMaliciousAccomplishment} = require('./accomplishments.fixtures')

describe('Accomplishments Endpoints', function () {
    let db 

    before('make knex connection', () => {
        db = knex ({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('accomplishments').truncate())

    afterEach('cleanup', () => db('accomplishments').truncate())

    describe('GET /api/accomplishments', () => {
        context('Given no accomplishments', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/accomplishments')
                    .expect(200, [])
            })
        })
        context('Given there are accomplishments in the database', () => {
            const testAccomplishments = makeAccomplishmentsArray()
    
            beforeEach('insert accomplishments', () => {
                return db   
                    .into('accomplishments')
                    .insert(testAccomplishments)
            })
    
            it('GET /api/accomplishments responds with 200 and all of the accomplishments', () => {
                return supertest(app)
                    .get('/api/accomplishments')
                    .expect(200, testAccomplishments)
            })
        })
    })

    describe('GET /api/accomplishments/:accomplishment_id', () => {
        context('Given no accomplishments', () => {
            it('responds with 404', () => {
                const accomplishmentId = 123456
                return supertest(app)
                    .get(`/api/accomplishments/${accomplishmentId}`)
                    .expect(404, {error: {message: 'Accomplishment doesn\'t exist'}})
            })
        })

        context('Given there are accomplishments in the database', () => {
            const testAccomplishments = makeAccomplishmentsArray()
    
            beforeEach('insert accomplishments', () => {
                return db   
                    .into('accomplishments')
                    .insert(testAccomplishments)
            })
    
            it('responds with 200 and the specified accomplishment', () => {
                const accomplishmentId = 2
                const expectedAccomplishment = testAccomplishments[ accomplishmentId -1 ]
                return supertest(app)
                    .get(`/api/accomplishments/${accomplishmentId}`)
                    .expect(200, expectedAccomplishment)
            })
        })

        context('Given an XSS attack accomplishment', () => {
            const maliciousAccomplishment = makeMaliciousAccomplishment()

            beforeEach('insert malicious accomplishment', () => {
                return db
                    .into('accomplishments')
                    .insert([maliciousAccomplishment])
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/accomplishments/${maliciousAccomplishment.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
+                       expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                    })
            })
        }) 

        describe('POST /api/accomplishments', () => {
            it('creates a accomplishment, responding with 201 and the new accomplishment', () => {
                const newAccomplishment = {
                    title: 'Test new accomplishment',
                    description: 'new description'
                }
    
                return supertest(app)
                    .post('/api/accomplishments')
                    .send(newAccomplishment)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql(newAccomplishment.title)
                        expect(res.body.description).to.eql(newAccomplishment.description)
                        expect(res.body).to.have.property('id')
                        expect(res.headers.location).to.eql(`/api/accomplishments/${res.body.id}`)
                        const expected = new Date().toLocaleString()
                        const actual = new Date(res.body.date_added).toLocaleString()
                        expect(actual).to.eql(expected)
                    })
                    .then(postRes => 
                        supertest(app)
                            .get(`/api/accomplishments/${postRes.body.id}`)
                            .expect(postRes.body)
                    )
            })

            const requiredFields = ['title', 'description']

            requiredFields.forEach(field => {
                const newAccomplishment = {
                    title: 'New Accomplishment',
                    description: 'something'
                }

                it(`responds withs 400 and an error message when the '${field}' is missing`, () => {
                    delete newAccomplishment[field]

                    return supertest(app)
                        .post('/api/accomplishments')
                        .send(newAccomplishment)
                        .expect(400, {error: {message: `Missing '${field}' in request body`}})
                })
            })
            
        })

        describe('DELETE /api/accomplishments/:accomplishment_id', () => {
            context('Given there are accomplishments in the database', () => {
                const testAccomplishments = makeAccomplishmentsArray()
    
                beforeEach('insert accomplishments', () => {
                    return db 
                        .into('accomplishments')
                        .insert(testAccomplishments)
                })
    
                it('responds with 204 and removes the accomplishments', () => {
                    const idToRemove = 2
                    const expectedAccomplishments = testAccomplishments.filter(accomplishment => accomplishment.id !== idToRemove)
                    return supertest(app)
                        .delete(`/api/accomplishments/${idToRemove}`)
                        .expect(204)
                        .then(res => 
                            supertest(app)
                                .get('/api/accomplishments')
                                .expect(expectedAccomplishments)
                        )
                })
            })
            context('Given no accomplishment', () => {
                it('responds with 404', () => {
                    const accomplishmentId = 123456
                    return supertest(app)
                        .delete(`/api/accomplishments/${accomplishmentId}`)
                        .expect(404, {error: {message: 'Accomplishment doesn\'t exist'}})
                })
            })
        })
    })




})


