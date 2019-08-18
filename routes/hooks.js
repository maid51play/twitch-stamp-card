var config = require('../oauth.js');
var pool = require('../queries.js');

var express = require('express');
var fetch = require('node-fetch')
var router = express.Router();

router.post('/streams', function(req, res, next) {
  if(req.body.data.length > 0) {
    pool.query(
      'UPDATE events SET status = $1 WHERE status = $2',
      ["archived", "active"])
      .then(results => {
        console.log('updated event with uuid: ', results.rows)
      })
      .then(results => {
        pool.query('INSERT INTO events (title,game,status) VALUES ($1, $2, $3)', [req.body.data[0].title, req.body.data[0].game_id, "active"])
        .then(results => {
          console.log('created event with uuid: ', results.rows)
          return res.status(200).json(results.rows)
        })
        .catch(err => {throw err})
      })
      .catch(err => {throw err})
  } else {
    pool.query(
      'UPDATE events SET status = $1 WHERE status = $2',
      ["archived", "active"])
      .then(results => {
        console.log('updated event with uuid: ', results.rows)
        return res.status(200).json(results.rows)
      })
      .catch(err => {throw err})
  }
});

router.get('/streams', function(req, res, next) {
  // TODO: run fix or otherwise check the stream status and update accordingly here
  res.status(200).send(req.query['hub.challenge']);
});

router.post('/i-want-to-connect', function(req, res, next) {
  if (req.headers.auth == config.adminAuth) {
    fetch('https://api.twitch.tv/helix/webhooks/hub', {
      method: 'post',
      body: JSON.stringify({
          'hub.callback': `${config.host}/hooks/streams`,
          'hub.mode': 'subscribe',
          'hub.topic': `https://api.twitch.tv/helix/streams?user_id=${config.twitch.twitchId}`,
          'hub.secret': config.twitch.hookSecret,
          'hub.lease_seconds': config.twitch.lease_seconds,
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Client-ID': config.twitch.clientID
      },
    }).then(() => res.sendStatus(200))
  } else {
    res.status(401).send("YOU CAN'T SIT WITH US!!!!")
  }
})

router.post('/so-sarazanmai', function(req, res, next) {
  if (req.headers.auth == config.adminAuth) {
    fetch('https://api.twitch.tv/helix/webhooks/hub', {
      method: 'post',
      body: JSON.stringify({
          'hub.callback': `${config.host}/hooks/streams`,
          'hub.mode': 'unsubscribe',
          'hub.topic': `https://api.twitch.tv/helix/streams?user_id=${config.twitch.twitchId}`,
          'hub.secret': config.twitch.hookSecret,
          'hub.lease_seconds': config.twitch.lease_seconds,
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Client-ID': config.twitch.clientID
      },
    }).then(() => res.sendStatus(200))
  } else {
    res.status(401).send("YOU CAN'T SIT WITH US!!!!")
  }
})

// TODO
// router.post('/fix', function(req, res, next) {
  // check the stream status
  // if it is up, check that the event title matches
  //   if it doesn't, archive the current (if any) event and create a new one
  // if it is down, archive the current event if there is one

  // maybe this endpoint should get hit every hour after a stream starts, until the stream ends?
// })

module.exports = router;
