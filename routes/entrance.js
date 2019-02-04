const express = require('express');
const router = express.Router();
MongoClient = require('mongodb').MongoClient;
const url =  'mongodb://localhost:27017/my_project';
const dbName = 'my_project';

// var store = new MongoDBStore({
//   uri: 'mongodb://localhost:27017/my_project',
//   collection: 'usersSessions'
// });


router.post('/signin', function(req, res, next) {
  let login = req.body.userLogin;
  let pass = req.body.userPass;
  if(!login || !pass) {;
    res.render('pages/errorall', {title: 'Ошибка', error: 'Вы не заполнили поля формы.'});
  } else {
    const stat = new Promise(function (fulfill, reject){
        fs.stat("/Users/nikita/Desktop/my_project/views/pages/allusersdata.ejs", function (err, stats){
          let lastM = Date.parse(stats.mtime);
          if (err) reject(err);
          else fulfill(lastM);
        });
      });
    stat.then(function(value) {
      if (req.headers['if-modified-since'] === value) {
        res.status(304);
      } else {
        res.status(200);
        res.header('Cache-Control', 'no-cache');
        res.set('Last-Modified', value);
        MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        const db = client.db(dbName);
        db.collection('users').find({login: login}).toArray(function (err, resul) {
            if (resul[0]) {
              bcrypt.compare(pass, resul[0].password, function(er, resultat) {
                if (resultat === true) {
                  req.session.userId = resul[0]._id;
                  req.session.userLogin = resul[0].login;
                  req.flash("success", "Вы успешно вошли авторизовались");
                  res.redirect('/iam');
                } else {
                  console.log('Bad request (400)');
                  res.render('pages/errorall', {title: 'Ошибка', error: 'Неверный логин или пароль'});
                }
                });
            } else {
              console.log('Bad request (400)');
              res.render('pages/errorall', {title: 'Ошибка', error: 'Неверный логин или пароль'});
            }
        });
        client.close();
      });
    }
  });
      }
    });



    router.get('/logout', function (req, res) {
      if(req.session) {
      req.session.destroy(function() {
        res.redirect('/iam');
      });
      } else {
        res.redirect('/iam');
      }
    });

module.exports = router;
