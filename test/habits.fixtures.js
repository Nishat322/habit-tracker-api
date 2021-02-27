function makeHabitsArray(){
    return [
        {
            id: 1, 
            title: 'Test Habit One', 
            description: 'Some test description', 
            motivation: 'Some test motivation',
            date_added: new Date('2100-05-22T16:28:32.615Z'),
            goal: '28', 
            days_completed: 0
        }, 
        {
            id: 2, 
            title: 'Test Habit Two', 
            description: 'Some test description', 
            motivation: 'Some test motivation', 
            date_added: new Date('1919-12-22T16:28:32.615Z'),
            goal: '4', 
            days_completed: 3
        },
        {
            id: 3, 
            title: 'Test Habit Three', 
            description: 'Some test desciptions', 
            motivation: '', 
            date_added: new Date('1919-12-22T16:28:32.615Z'),
            goal: '13', 
            days_completed: null
        }
    ]
}

module.exports = {
    makeHabitsArray
}