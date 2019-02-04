const express = require('express');
const router = express.Router();


router.get('/', function (req, res) {
  res.render('pages/log_in', {title: 'Страница входа'});
});

module.exports = router;
