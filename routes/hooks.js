var config = require('../oauth.js');
var pool = require('../queries.js');

var express = require('express');
var fetch = require('node-fetch')
var router = express.Router();

router.post('/streams', async function(req, res, next) {
  let stream = req.body;
  updateEventsService(stream, req)
  .then(() => res.status(200).send('stream events refreshed!'))
  .catch(err => res.status(500).send('something is wrong ; A;'))
});

router.get('/streams', function(req, res, next) {
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

router.get('/fix', async function(req, res, next) {
  let stream = await fetch(
    `https://api.twitch.tv/helix/streams?user_id=${config.twitch.twitchId}`, {
      method: 'get',
      headers: { 
        'Content-Type': 'application/json',
        'Client-ID': config.twitch.clientID
      },
    }).then(response => response.json())

  updateEventsService(stream, req)
  .then(() => res.status(200).send('all fixed!'))
  .catch(err => res.status(500).send('needs more healing ; A;'))
})

let updateEventsService = async (stream, req) => {
  let streamId = stream.data[0] ? stream.data[0].id : undefined;

  let activeEvents = await pool.query(
    'SELECT * FROM events WHERE status = $1', ["active"]).then(results => results.rows)
  let streamEvent = await pool.query(
    'SELECT * FROM events WHERE "streamId" = $1', [streamId])
  
  let archivePromises = []
  let archiveEvent = (id) => pool.query(
    'UPDATE events SET status = $1 WHERE id = $2',
    ["archived", id]
  )

  activeEvents.map(event => {
    if(event.streamId != streamId) {
      archivePromises.push(archiveEvent(event.id))
    }
  })

  let createEvent = () => pool.query(
    'INSERT INTO events ("title","status","streamId") VALUES ($1,$2,$3)',
    [stream.data[0].title, "active", streamId]
  )
  let activateEvent = (id) => pool.query(
    'UPDATE events SET status = $1 WHERE id = $2',
    ["active", id]
  )

  Promise.all(archivePromises).then(() => {
    if(streamEvent.rows[0]) { 
      if(streamEvent.rows[0].status == "active") { return; }
      return activateEvent(streamEvent.rows[0].id);
    }
    if(streamId) {
      createEvent();
    }
  })
}



module.exports = router;
