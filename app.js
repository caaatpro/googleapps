const fs = require('fs');
require('chromedriver');
const webdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const mysql = require('mysql');
const config = require('./config.json');

var driver;
const host = 'https://play.google.com';
const initLink = 'https://play.google.com/store/apps';
const attr = '&showAllReviews=true';

var applist = [];
var parserIndex = 0;

const pool = mysql.createPool({
    connectionLimit: 10,
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    charset : 'utf8mb4'
});

const applistTxt = fs.readFileSync('applist.txt', 'utf8');
const reviewsScript = fs.readFileSync('scripts/reviews.js', 'utf8');

const scriptRun = async (script) => {
    let data = driver.executeAsyncScript(script);

    return data;
};


const saveData = (data) => {
    var query = 'INSERT INTO `reviews` (`link`, `text`, `rating`, `date`) VALUES ';
    var count = data.reviews.length;

    if (count == 0) {
        return parserData();
    }

    data.reviews.forEach((item, i) => {

        query += "(" + pool.escape(data.link) + ", " + pool.escape(item.text) + ", " + pool.escape(item.rating) + ", " + pool.escape(item.date) + ")";

        if (i != count-1) {
            query += ', ';
        }
    });

    pool.query(query,
        function (err, result) {
            if (err) throw err;

            parserData();
        }
    );
};

const parserData = async () => {
    parserIndex++;

    if (applist.length <= parserIndex) {
        console.log('End all');
        return;
    }

    let link = applist[parserIndex];

    console.log(link);

    await driver.get(link);

    let reviews = await scriptRun(reviewsScript);

    // console.log(reviews);

    saveData({
        reviews: reviews,
        link: link
    });
    return;
}

const screen = {
    width: 640,
    height: 480
};

const browserInit = () => {
    driver = new webdriver.Builder()
        .forBrowser('chrome')
        // .setChromeOptions(new chrome.Options().headless().windowSize(screen))
        .build();

    driver.manage().setTimeouts({
        script: 10000000
    });
}

///

const getInit = () => {
    console.log('Init...');
    
    var ignoredLinks = [];
    // Load ignored links
    query = "SELECT `link` FROM `reviews` GROUP BY `link`";

    pool.query(query, function (err, result) {
        if (err) throw err;

        for (const row of result) {
            if (ignoredLinks.indexOf(row.link) != -1) continue;

            ignoredLinks.push(row.link);
        }

        applist = [];

        applistTxt.split('\n').forEach((item) => {
            let link = host+item+attr;
            if (applist.indexOf(link) != -1 || item == '' || item.indexOf('$') == 0 || ignoredLinks.indexOf(link) != -1) {
                return true;
            }
            applist.push(host+item+attr);
        });
        
        console.log(applist.length);

        browserInit();
    
        console.log('Init end');
    
        console.log('Parse...');
        getAppInfo()
    });
};

const getAppInfo = async () => {
    await driver.get(initLink);

    parserData();
}


getInit();