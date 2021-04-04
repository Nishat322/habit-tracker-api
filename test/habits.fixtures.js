function makeAccomplishmentsArray(){
    return [
        {
            id: 1, 
            title: 'Test Accomplishment One', 
            description: 'Some test description', 
            date_added: '2100-05-22T16:28:32.615Z',
        }, 
        {
            id: 2, 
            title: 'Test Accomplishment Two', 
            description: 'Some test description', 
            date_added: '1919-12-22T16:28:32.615Z',
        },
        {
            id: 3, 
            title: 'Test Accomplishment Three', 
            description: 'Some test desciptions', 
            date_added: '1919-12-22T16:28:32.615Z',
        }
    ]
}

function makeMaliciousAccomplishment(){
    return {
            id: 911,
            title: 'Naughty naughty very naughty <script>alert("xss");</script>',
            description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
            date_added: '1919-12-22T16:28:32.615Z',
    }
}

module.exports = {
    makeAccomplishmentsArray,
    makeMaliciousAccomplishment
}