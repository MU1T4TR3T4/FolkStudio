const bcrypt = require('bcryptjs');
const fs = require('fs');

const password = 'admin12345';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function (err, hash) {
    if (err) {
        console.error(err);
        return;
    }
    fs.writeFileSync('hash.txt', hash);
});
