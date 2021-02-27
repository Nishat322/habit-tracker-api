function makeHabitsArray(){
    return [
        {
            id: 1, 
            title: 'Habit One', 
            description: 'some descripton', 
            motivation: 'You are doing so well',
            date_added: new Date('2100-05-22T16:28:32.615Z'),
            goal: '28', 
            days_completed: 0
        }, 
        {
            id: 2, 
            title: 'Habit Two', 
            description: 'some description', 
            motivation: 'some', 
            date_added: new Date('1919-12-22T16:28:32.615Z'),
            goal: '4', 
            days_completed: 3
        },
        {
            id: 3, 
            title: 'Habit Three', 
            description: 'some desciptions', 
            motivation: 'Well Done!', 
            date_added: new Date('1919-12-22T16:28:32.615Z'),
            goal: '13', 
            days_completed: 2
        }
    ]
}

module.exports = {
    makeHabitsArray
}