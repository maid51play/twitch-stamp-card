module.exports = function(app, passport) {
  var pool = require('../queries.js');
  var config = require('../oauth.js');
  var express = require('express');
  var router = express.Router();

  router.get('/events', ensureAuthenticated, function(req, res, next) {
    pool.query(
      'SELECT streamId FROM events WHERE status = $1',
      ["active"])
      .then(results => {
        if (results.rows.length == 0) { throw {status: 404, message: "no active events"} }
        if (results.rows.length > 1) { throw {status: 500, message: "multiple active events"} }
        return results.rows[0]
      })
      .then(result => `${config.host}/event/${result.streamId}`)
      .then(url => res.status(200).send(url))
      .catch(err => res.status(err.status).send(err.message))
  })

  router.get('/stamps', ensureAuthenticated, function(req, res, next) {
    userId = twitchIdFromNightBot(req.headers['nightbot-user']);

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

  router.get('/stamp-me-bb', ensureAuthenticated, function(req, res, next) {
    userId = twitchIdFromNightBot(req.headers['nightbot-user']);

    var createStamp = event => pool.query(
      'INSERT INTO stamps ("twitchUserId","eventId") VALUES ($1,$2)',
      [userId, event.id])

    pool.query(
      'SELECT "id", "streamId" FROM events WHERE status = $1',
      ["active"])
      .then(results => {
        if (results.rows.length == 0) { throw {status: 404, message: "5.1 Play isn't streaming yet! Please come back when we are streaming ♡ If nightbot is wrong, try waiting a few minutes or typing !fix"} }
        if (results.rows.length > 1) { throw {status: 500, message: "だれかたすけて！ !fix and try again?"} }
        return results.rows[0]
      })
      .then(createStamp)
      .then(result => res.status(200).send("ありがとうございます！ Thank you for your continued support ♡ !stampcard to see your stamp card progress~"))
      .catch(err => {
        if (err.message == 'duplicate key value violates unique constraint "unique stamps"') {
          err.message = "You can only stamp once per stream!"
        }
        return res.status(200).send(err.message)
      })
  })

  function ensureAuthenticated(req, res, next) {
    if (req.query.auth == config.nightBot.secret) { return next(); }
    res.status(401).send("You're not nightbot! You only play one on TV.")
  }

  return router;
}

let twitchIdFromNightBot = (nightbotUser) => nightbotUser.split("&")[3].split("=")[1]