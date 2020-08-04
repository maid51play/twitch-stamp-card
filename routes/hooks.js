require('dotenv').config();
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

router.post('/i-want-to-connect', async function(req, res, next) {
  if (req.headers.auth == process.env.ADMIN_AUTH) {
    oauthToken = await getOauth();
    
    fetch('https://api.twitch.tv/helix/webhooks/hub', {
      method: 'post',
      body: JSON.stringify({
          'hub.callback': `${process.env.HOST}/hooks/streams`,
          'hub.mode': 'subscribe',
          'hub.topic': `https://api.twitch.tv/helix/streams?user_id=${process.env.TWITCH_ID}`,
          'hub.secret': process.env.HOOK_SECRET,
          'hub.lease_seconds': process.env.LEASE_SECONDS,
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${oauthToken.access_token}`
      },
    }).then(() => res.sendStatus(200))
  } else {
    res.status(401).send("YOU CAN'T SIT WITH US!!!!")
  }
})

router.post('/so-sarazanmai', async function(req, res, next) {
  if (req.headers.auth == process.env.ADMIN_AUTH) {
    oauthToken = await getOauth();

    fetch('https://api.twitch.tv/helix/webhooks/hub', {
      method: 'post',
      body: JSON.stringify({
          'hub.callback': `${process.env.HOST}/hooks/streams`,
          'hub.mode': 'unsubscribe',
          'hub.topic': `https://api.twitch.tv/helix/streams?user_id=${process.env.TWITCH_ID}`,
          'hub.secret': process.env.HOOK_SECRET,
          'hub.lease_seconds': process.env.LEASE_SECONDS,
      }),
      headers: { 
        'Content-Type': 'application/json',
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${oauthToken.access_token}`
      },
    }).then(() => res.sendStatus(200))
  } else {
    res.status(401).send("YOU CAN'T SIT WITH US!!!!")
  }
})

let requestConnection = () => fetch(`${process.env.HOST}/hooks/i-want-to-connect`, {
  method: 'post',
  headers: { 
    'Content-Type': 'application/json',
    'auth': process.env.ADMIN_AUTH
  },
})

let refreshConnection = async () => {
  console.log('REFRESHING CONNECTION')
  let activeEvents = await pool.query(
    'SELECT * FROM events WHERE status = $1', ["active"]).then(results => results.rows)
  if(activeEvents.length <= 0) {
    clearInterval(waitingForStreamEnd);
  } else {
    requestConnection()
  }
}
let waitingForStreamEnd;
router.get('/okite', async function(req, res, next) {
  requestConnection();
  const milliseconds = (process.env.LEASE_SECONDS * 1000) - 60000
  waitingForStreamEnd = setInterval(refreshConnection, milliseconds);
  res.status(200).send('おはようございますヾ(￣0￣ )ノ')
})

router.get('/fix', async function(req, res, next) {
  console.log(process.env.TWITCH_CLIENT_ID)
  oauthToken = await getOauth();

  let stream = await fetch(
    `https://api.twitch.tv/helix/streams?user_id=${process.env.TWITCH_ID}`, {
      method: 'get',
      headers: { 
        'Content-Type': 'application/json',
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${oauthToken.access_token}`
      },
    }).then(response => response.json())

  updateEventsService(stream, req)
  .then(() => res.status(200).send('all fixed!'))
  .catch(err => {
    console.log(err)
    res.status(500).send('needs more healing ; A;')
  })
})

let updateEventsService = async (stream, req) => {
  console.log(stream)
  console.log(stream.data)
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

let getOauth = () => {
  return fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
    method: 'post'
  }).then((response) => response.json())
  .then((data) => data)
}


module.exports = router;
