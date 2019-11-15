var pool = require('../queries.js');
var express = require('express');
var router = express.Router();

const { render } = require('../lib/stamps');

module.exports = (app, passport) => {
  /* GET home page. */
  router.get('/', ensureAuthenticated, function(req, res, next) {
    res.render('index')
  });

  router.get('/:id.png', async function(req, res, next) {
    result = await pool.query(
      `SELECT "eventId", "id" FROM stamps WHERE "twitchUserId" = $1 AND "archived" = $2 ORDER BY "createdAt" ASC`
    , [req.params.id, false])

    const canvas = render(result.rows);
    const stream = canvas.createPNGStream();

    stream.pipe(res);
  })

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

  return router;
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect(`/login?referer=${req.url}`);
}

function getUser(req) {
  return req.user ? req.user.display_name : false
}

function getUserId(req) {
  return req.user ? req.user.id : false
}
