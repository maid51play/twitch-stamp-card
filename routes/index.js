var pool = require('../queries.js');
var express = require('express');
var router = express.Router();

const { createCanvas, loadImage } = require('canvas')

module.exports = function(app, passport) {

  /* GET home page. */
  router.get('/', ensureAuthenticated, function(req, res, next) {
    res.render('index')
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
      `SELECT "eventId" FROM stamps WHERE "twitchUserId" = $1 AND "archived" = $2 ORDER BY "createdAt" ASC`
    , [req.params.id, false])

    stamps = stampResults.rows;

    const canvas = createCanvas(800, 500);
    const ctx = canvas.getContext('2d');
    
    const background = await loadImage('public/images/stampcard.png');
    const stamp = await loadImage('public/images/stamp.png');
    const halloween2020stamp = await loadImage('public/images/halloweenstamp.png');
    ctx.drawImage(background,0,0,800,500);

    for(i=0;i<stamps.length;i++) {
      const [x,y] = getStampCoordinates(i)
      if(stamps[i].eventId == "16" || stamps[i].eventId == "15") {
        ctx.drawImage(halloween2020stamp,x-55,y-55,110,110)
      } else {
        ctx.drawImage(stamp,x-55,y-55,110,110)
      }
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
