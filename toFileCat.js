const fs = require('fs');
const mysql = require('mysql');
const config = require('./config.json');

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

    // var cat = 'Автомобили и транспорт';
    // var cat = 'Жилье и дом';
    // var cat = 'Здоровье и фитнес';
    // var cat = 'Медицина';
    // var cat = 'Музыка';
    // var cat = 'Образование';
    // var cat = 'Финансы';
    // var cat = 'Фотография';
    // var cat = 'Головоломки';
    var cat = 'Обучающие';

    // Load ignored links
    query = "SELECT reviews.link, reviews.text, cats.tile FROM reviews LEFT JOIN cats ON cats.applink = reviews.link WHERE cats.tile IN ('"+cat+"')";

    pool.query(query, function (err, result) {
        if (err) throw err;

        console.log('Working...');


        var reviewsList = {};
        var catTitle = '';

        result.forEach(item => {

            // console.log(item.text);
            catTitle = item.tile;

            let line = item.text.trim();

            line = removeDuble(line);

            // reviewsList.push(line);
            

            if (reviewsList[item.link] == undefined) {
                reviewsList[item.link] = [];
            }

            reviewsList[item.link].push(line);
        });

        var fileList = 'reviewsList-' + catTitle + '.txt';
        fs.writeFileSync(fileList, '');


        var i = 0;
        var listStream = fs.createWriteStream(fileList, {flags: 'a'});

        for (const key in reviewsList) {
            if (!reviewsList.hasOwnProperty(key)) continue;

            itemL = reviewsList[key];

            itemL.sort((a, b) => {
                return Math.random() - 0.5;
            });

            itemL.forEach(originalLine => {
                listStream.write('\n'+i+'\n\n');
                // listStream.write(originalLine + '\n');
                
                var line = originalLine.replace(/([\.\!\?]+)/g, "$1\n");

                var lines = line.split('\n');

                lines.forEach(singleLine => {
                    singleLine = singleLine.trim();
                    if (singleLine == '') return true;

                    listStream.write(singleLine + '\n');
                });


            i++;
            });
        }

        listStream.end();

        pool.end();

        console.dir('End');
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
