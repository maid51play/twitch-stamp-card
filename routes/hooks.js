var config = require('../oauth.js');

var express = require('express');
var fetch = require('node-fetch')
var router = express.Router();

router.post('/streams', function(req, res, next) {
  console.log('POST')
  console.log(req.body.data);
  res.sendStatus(200);
});

router.get('/streams', function(req, res, next) {
  console.log('GET')
  console.log(req.query['hub.mode'])
  console.log(req.query['hub.challenge']);
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
