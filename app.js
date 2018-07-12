var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var rootCas = require('ssl-root-cas/latest').create();
require('https').globalAgent.options.ca = rootCas;


var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/iuno_production_manager', { promiseLibrary: require('bluebird') })
    .then(() =>  console.log('connection successful'))
    .catch((err) => console.error(err));

var ultimaker_discovery = require('./services/ultimaker_printer_discovery_service');
ultimaker_discovery.on('serviceUp',function (service) {
    console.debug('mDNS service up',service);
});
ultimaker_discovery.on('serviceDown',function (service) {
    console.debug('mDNS service down',service);
});

// var drinks = require('./routes/drinks');
// var users = require('./routes/users');
// var orders = require('./routes/orders');
// var admin = require('./routes/admin');
// var components = require('./routes/components');
var machines = require('./routes/machines');
var shopping_cart = require('./routes/shopping_cart');
var orders = require('./routes/orders');

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'dist')));

// app.use('/api/drinks', drinks);
// app.use('/api/users', users);
// app.use('/api/orders', orders);
// app.use('/api/admin', admin);
// app.use('/api/components', components);
app.use('/api/machines', machines);
app.use('/api/shopping_cart', shopping_cart);
app.use('/api/orders', orders);

app.all('/api/*', function (req, res, next) {
    res.sendStatus(404);
});

app.all('*', function (req, res, next) {
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile(path.join(__dirname, 'dist/index.html'));
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        console.error(err.stack);
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: err
        });
    });
} else {
    app.use(function (err, req, res, next) {
        console.error(err.stack);
        res.status(500);
        res.send('Something broke!')
    });
}

module.exports = app;
