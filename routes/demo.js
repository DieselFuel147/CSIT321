var express = require('express');
var router = express.Router();

/* GET demo dashboard. */
router.get('/', function(req, res, next) {
  res.render('dash/index', {
    layout: 'dash/layout',
    title: 'BeeBit Dashboard'
  });
});

module.exports = router;