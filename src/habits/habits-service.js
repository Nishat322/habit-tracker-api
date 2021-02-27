const HabitsService = {
    getAllHabits(knex) {
        return knex.select('*').from('habits')
    }
}

module.exports = HabitsService