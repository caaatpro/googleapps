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
            // let line = item.link + '|' + item.text + '|' + item.rating + '|' + item.date;

            // if (reviewsList.indexOf(line) != -1) {
            //     console.log(item.id);
            //     return true;
            // }

            // console.log(item.text);

            let line = item.text.trim();

            line = removeDuble(line);

            reviewsList.push(line);
        });


        reviewsList.sort((a, b) => {
            return Math.random() - 0.5;
        });

        reviewsList.forEach(item => {
            listStream.write(item+'\n');
        });

        listStream.end();

        pool.end();

        console.log('End');
    });
};


function removeDuble(str) {
    var separator = str.indexOf('…');
    
    if (separator == -1) {
        return str;
    }

    var part1 = str.substr(0, separator);
    var part2 = str.substr(separator+1);

    if (part2.indexOf(part1) != -1) {
        str = part2.trim();
    }

    return str;
}

init();
