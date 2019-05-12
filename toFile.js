const fs = require('fs');
const mysql = require('mysql');
const config = require('./config.json');

var reviewsList = [];
var fileList = 'reviewsList.txt';

const pool = mysql.createPool({
    connectionLimit: 10,
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    charset : 'utf8mb4'
});



const init = () => {
    console.log('Init...');

    // Load ignored links
    query = "SELECT id, link, text, rating, date FROM `reviews`";

    pool.query(query, function (err, result) {
        if (err) throw err;

        console.log('Working...');

        fs.writeFileSync(fileList, '');

        var listStream = fs.createWriteStream(fileList, {flags: 'a'});

        result.forEach(item => {
            let line = item.link + '|' + item.text + '|' + item.rating + '|' + item.date;

            if (reviewsList.indexOf(line) != -1) {
                console.log(item.id);
                return true;
            }

            console.log(line);

            reviewsList.push(line);

            listStream.write(item.text+'\n');
        });

        listStream.end();

        pool.end();

        console.log('End');
    });
};


init();