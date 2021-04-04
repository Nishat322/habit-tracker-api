const AccomplishmentsService = {
    getAllAccomplishments(knex) {
        return knex
            .select('*')
            .from('accomplishments')
    },

    insertAccomplishment(knex, newAccomplishment){
        return knex 
            .insert(newAccomplishment)
            .into('accomplishments')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },

    getById(knex, id){
        return knex
            .from('accomplishments')
            .select('*')
            .where('id', id)
            .first()
    },

    deleteAccomplishment(knex, id){
        return knex('accomplishments')
            .where({id})
            .delete()
    },

    updateAccomplishment(knex, id, newAccomplishmentFields){
        return knex('accomplishments')
            .where({id})
            .update(newAccomplishmentFields)
    }
}

module.exports = AccomplishmentsService