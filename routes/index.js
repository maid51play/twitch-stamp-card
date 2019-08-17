var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/foo', function(req, res, next) {
  res.render('event', {user: 'sidke', stamps: '90000'});
});

module.exports = router;
