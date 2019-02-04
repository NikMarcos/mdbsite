const express = require('express');
const router = express.Router();
MongoClient = require('mongodb').MongoClient;
const url =  'mongodb://localhost:27017/my_project';
const dbName = 'my_project';


router.get('/', function (req, res, next) {
  res.render('pages/verifyToken', {title: "Страница верификации"});
});

router.post('/', function (req, res, next) {
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
    let db = client.db(dbName);
      db.collection('users').find({"token": req.body.token}).toArray(function (err, result) {
        if (result[0] && result[0].token == req.body.token) {
          let date = result[0].createdAt;
          db.collection('users').updateOne({'token':req.body.token}, {'$unset': {'createdAt': date, 'token': req.body.token }});
          client.close();
          req.flash('warning', "Вы успешно верифицированны. Пожалуйста, авторизуйтесь для дальнейшей работы.");
          res.redirect('/');
        } else {
          client.close();
          req.flash('warning', "Вы ввели неверный код верификации. Повторите попытку");
          res.render('pages/verifyToken', {title: "Страница верификации"});
        }

    });
});
});

module.exports = router;
