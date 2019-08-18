module.exports = function(app, passport) {
  var express = require('express');
  var router = express.Router();

  /* GET home page. */
  router.get('/', ensureAuthenticated, function(req, res, next) {
    res.render('stampCard', {user: getUser(req), stamps: 90003});
  });

  router.get('/login', function(req, res, next) {
    if(req.user) {
      if(req.query.referer) {
        return res.redirect(req.query.referer);
      } else{
        return res.redirect('/')
      }
    }
    res.render('login');
  });

  router.get('/event/:id', ensureAuthenticated, function(req, res, next) {
    res.render('event', {user: getUser(req), stamps: 90000});
  });

  return router;
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect(`/login?referer=${req.url}`);
}

function getUser(req) {
  return req.user ? req.user.display_name : false
}
