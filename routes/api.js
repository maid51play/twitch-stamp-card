module.exports = function(app, passport) {
  var pool = require('../queries.js');
  var config = require('../oauth.js');
  var express = require('express');
  var router = express.Router();

  router.get('/events', ensureAuthenticated, function(req, res, next) {
    pool.query(
      'SELECT uuid FROM events WHERE status = $1',
      ["active"])
      .then(results => {
        if (results.rows.length == 0) { throw {status: 404, message: "no active events"} }
        if (results.rows.length > 1) { throw {status: 500, message: "multiple active events"} }
        return results.rows[0]
      })
      .then(result => `${config.host}/event/${result.uuid}`)
      .then(url => res.status(200).send(url))
      .catch(err => res.status(err.status).send(err.message))
  })

  router.get('/stamps', ensureAuthenticated, function(req, res, next) {
    // todo: get twitch user from headers
    userId = 118128730;

    pool.query(
      `SELECT COUNT( * ) FROM stamps WHERE "twitchUserId" = $1`
    , [userId])
    .then(results => results.rows[0].count)
    .then(stamps => {
      // TODO generate a stamp card image here
      url = stamps;

      return url;
    })
    .then(url => res.send(200, url))
  })

  router.post('/stamps', ensureAuthenticated, function(req, res, next) {
    // todo: get twitch user from headers
    userId = 118128730;

    var createStamp = event => pool.query(
      'INSERT INTO stamps ("twitchUserId","eventId") VALUES ($1,$2)',
      [userId, event.id])

    pool.query(
      'SELECT id, uuid FROM events WHERE status = $1',
      ["active"])
      .then(results => {
        if (results.rows.length == 0) { throw {status: 404, message: "no active events"} }
        if (results.rows.length > 1) { throw {status: 500, message: "multiple active events"} }
        return results.rows[0]
      })
      .then(createStamp)
      .then(result => res.sendStatus(200))
      .catch(err => res.status(err.status || 500).send(err.message))
  })

  function ensureAuthenticated(req, res, next) {
    if (req.query.auth == config.nightBot.secret) { return next(); }
    res.status(401).send("You're not nightbot! You only play one on TV.")
  }

  return router;
}