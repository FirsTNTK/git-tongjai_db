var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');



require('dotenv').config({ path: './sengrid.env' });





var indexApi = require('./routes/index');
var usersApi = require('./routes/api/users/usersRoutes');
var messagesApi = require('./routes/api/messages/messagesRoutes');
var subscribesApi = require('./routes/api/subscribes/subscribesRoutes');
var banksApi = require('./routes/api/banks/banksRoutes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexApi);
app.use('/api/users', usersApi);
app.use('/api/messages', messagesApi);
app.use('/api/subscribes', subscribesApi);
app.use('/api/banks', banksApi);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
