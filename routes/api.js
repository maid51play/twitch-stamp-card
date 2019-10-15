require('dotenv').config();
var pool = require('../queries.js');
var express = require('express');
var router = express.Router();
var fetch = require('node-fetch');
const fs = require('fs');

module.exports = function(app, passport) {
  router.get('/events', ensureAuthenticated, function(req, res, next) {
    pool.query(
      'SELECT streamId FROM events WHERE status = $1',
      ["active"])
      .then(results => {
        if (results.rows.length == 0) { throw {status: 404, message: "no active events"} }
        if (results.rows.length > 1) { throw {status: 500, message: "multiple active events"} }
        return results.rows[0]
      })
      .then(result => `${process.env.HOST}/event/${result.streamId}`)
      .then(url => res.status(200).send(url))
      .catch(err => res.status(err.status).send(err.message))
  })

  router.get('/stamps', ensureAuthenticated, ensureAdmin, ensureTwitch, function(req, res, next) {
    userId = twitchIdFromNightBot(req.headers['nightbot-user']);
    userName = twitchNameFromNightBot(req.headers['nightbot-user']);

    url = `${process.env.HOST}/${userId}.png`

    res.status(200).send(`@${userName} You can view your stamp card here: ${url}`);
  })

  router.get('/stamp-me-bb', ensureAuthenticated, ensureTwitch, function(req, res, next) {
    userId = twitchIdFromNightBot(req.headers['nightbot-user']);
    userName = twitchNameFromNightBot(req.headers['nightbot-user']);

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
      .then(result => res.status(200).send(`@${userName} ありがとうございます！ Thank you for your continued support ♡ !stampcard to see your stamp card progress~`))
      .catch(err => {
        if (err.message == 'duplicate key value violates unique constraint "unique stamps"') {
          err.message = "You can only stamp once per stream!"
        }
        console.log(err)
        return res.status(200).send(err.message)
      })
  })


  router.get('/lotto', ensureAuthenticated, ensureDiscord, ensureAdmin, async function(req, res, next) {
    // fullStampCards = await pool.query(
    //   `SELECT "twitchUserId" FROM stamps WHERE archived = $1 GROUP BY "twitchUserId" HAVING COUNT(*) >= 15`
    // , [false])

    // const entryPromises = await fullStampCards.rows.map(async row => {
    //   const twitchId = row.twitchUserId;
    //   const twitchDisplayNameResponse = await fetch(`https://api.twitch.tv/helix/users?id=${twitchId}`, {
    //     headers: { 
    //       'Content-Type': 'application/json',
    //       'Client-ID': process.env.TWITCH_CLIENT_ID
    //     },
    //   })
    //   const twitchDisplayName = await twitchDisplayNameResponse.json();
    //   return {id: twitchId, displayName: twitchDisplayName.data[0].display_name}
    // });
    // const entries = await Promise.all(entryPromises)

    // if(entries.length < 1) {
    //   return res.status(200).send("Boohoo no participants ; A;")
    // }

    // const winner = entries[Math.floor(Math.random() * entries.length)]

    // const winnersText = entries.reduce((acc, entry) => acc + `\n ${entry.displayName}`, `WINNER: ${winner.displayName}\n`)


    // // send the winner and participant data somewhere
    // fs.writeFile('public/winners.txt', winnersText, async (err) => {
    //   // throws an error, you could also catch it here
    //   if (err) throw err;
  
    //   // success case, the file was saved
    //   const entriesQuery = entries.reduce((acc, entry) => acc + "" + entry.id + ", ", "(").slice(0,-2).concat(")")
    //   await pool.query(
    //     `UPDATE stamps SET archived = $1 WHERE "twitchUserId" IN ${entriesQuery}`
    //   , [true])

    //   res.status(200).send(`View winners at ${process.env.HOST}/winners.txt`)
    // });

    res.status(200).send("foo")
    
    
  })

  function ensureTwitch(req, res, next) {
    if(providerFromNightBot(req.headers['nightbot-user']) == "twitch") { return next(); }
    res.status(200).send("Stamp cards are only available on twitch!")
  }

  function ensureDiscord(req, res, next) {
    if(providerFromNightBot(req.headers['nightbot-user']) == "discord") { return next(); }
    res.status(200).send("This command is not available on twitch")
  }

  function ensureAdmin(req, res, next) {
    if(userLevelFromNightBot(req.headers['nightbot-user']) == "moderator") { return next(); }
    res.status(200).send("I'm sorry goshujinsama I can't do that")
  }

  function ensureAuthenticated(req, res, next) {
    if (req.query.auth == process.env.NIGHTBOT_SECRET) { return next(); }
    res.status(401).send("You're not nightbot! You only play one on TV.")
  }

  return router;
}

let providerFromNightBot = (nightbotUser) => nightbotUser.split("&")[2].split("=")[1]
let userLevelFromNightBot = (nightbotUser) => nightbotUser.split("&")[4].split("=")[1]
let twitchIdFromNightBot = (nightbotUser) => nightbotUser.split("&")[3].split("=")[1]
let twitchNameFromNightBot = (nightbotUser) => nightbotUser.split("&")[1].split("=")[1]
