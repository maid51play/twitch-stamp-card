var pool = require('../queries.js');
var express = require('express');
var router = express.Router();

const { createCanvas, loadImage } = require('canvas')

module.exports = function(app, passport) {

  /* GET home page. */
  router.get('/', ensureAuthenticated, function(req, res, next) {
    var countStamps = () => pool.query(`SELECT COUNT( * ) FROM stamps WHERE "twitchUserId" = ${getUserId(req)}`).then(results => results)

    countStamps().then(result => res.render('stampCard', {user: getUser(req), stamps: result.rows[0].count}))
  });

  const getStampCoordinates = (index) => {
    const rows = 3;
    const columns = 5;
    const x1 = 60;
    const y1 = 110;
    const x2 = 740;
    const y2 = 390;
    const rowHeight = (y2 - y1) / (rows - 1);
    const columnWidth = (x2 - x1) / (columns - 1);

    const row = Math.floor(index / columns);
    const column = index % columns;

    const x = (columnWidth * column) + x1
    const y = (rowHeight * row) + y1
    return [x,y];
  }

  router.get('/:id.png', async function(req, res, next) {

    stampResults = await pool.query(
      `SELECT COUNT( * ) FROM stamps WHERE "twitchUserId" = $1`
    , [req.params.id])

    stamps = stampResults.rows[0].count;

    const canvas = createCanvas(800, 500);
    const ctx = canvas.getContext('2d');
    
    const background = await loadImage('public/images/stampcard.png');
    const stamp = await loadImage('public/images/stamp.png');
    ctx.drawImage(background,0,0,800,500);

    for(i=0;i<stamps;i++) {
      const [x,y] = getStampCoordinates(i)
      ctx.drawImage(stamp,x-55,y-55,110,110)
    }

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

  router.get('/event/:id', ensureAuthenticated, function(req, res, next) {
    var checkUuid = () => pool.query(
      'SELECT id, status, title FROM events WHERE uuid = $1',
      [req.params.id])

    var createStamp = (event) => pool.query(
      'INSERT INTO stamps ("twitchUserId","eventId") VALUES ($1,$2)',
      [getUserId(req),event.id]).then(results => event).catch(err => event)

    var countStamps = (event) => pool.query(`SELECT COUNT( * ) FROM stamps WHERE "twitchUserId" = ${getUserId(req)}`).then(results => ({count: results.rows[0].count, event: event.title}))

    checkUuid()
    .then(result => {
      if(result.rows.length == 1 && result.rows[0].status == "active") {
        return result.rows[0]
      } else {
        return res.render('expiredEvent', { user: getUser(req) });
      }
    })
    .then(createStamp)
    .then(countStamps)
    .then(result => res.render('stampCard', {user: getUser(req), stamps: result.count, event: result.event}))
    .catch(err => res.render('error', { user: getUser(req), message: "", error: err }))
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
