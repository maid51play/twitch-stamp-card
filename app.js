require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var passport = require('passport');
var TwitchStrategy = require('passport-twitch-new').Strategy;
var session = require('express-session')
var fetch = require('node-fetch')

var indexRouter = require('./routes/index')(app, passport);
var authRouter = require('./routes/auth')(app, passport);
var usersRouter = require('./routes/users');
var hooksRouter = require('./routes/hooks');
var apiRouter = require('./routes/api')(app, passport);

// serialize and deserialize
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// config passport
passport.use(new TwitchStrategy({
  clientID: process.env.TWITCH_CLIENT_ID, 
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
  callbackURL: process.env.TWITCH_CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: process.env.SESSION_SECRET }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/hooks', hooksRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

// start listening for events

let requestConnection = () => fetch(`${process.env.HOST}/hooks/i-want-to-connect`, {
        method: 'post',
        headers: { 
          'Content-Type': 'application/json',
          'auth': process.env.ADMIN_AUTH
        },
    })
const milliseconds = (process.env.LEASE_SECONDS * 1000) - 60000
setInterval(requestConnection, milliseconds);
requestConnection();
