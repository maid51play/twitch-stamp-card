module.exports = function(app, passport) {
  var express = require('express');
  var router = express.Router();

  /* GET home page. */
  router.get('/', function(req, res, next) {
    if(req.user && req.query.referer) {
      res.redirect(req.query.referer);
    }
    res.render('live', { user: getUser(req), title: 'Express' });
  });

  router.get('/event/:id', ensureAuthenticated, function(req, res, next) {
    res.render('event', {user: getUser(req), stamps: 90000});
  });

  router.get('/me/stamps', ensureAuthenticated, function(req, res, next) {
    res.render('stampCard', {user: getUser(req), stamps: 90003});
  })

  return router;
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect(`/?referer=${req.url}`);
}

function getUser(req) {
  return req.user ? req.user.display_name : false
}
