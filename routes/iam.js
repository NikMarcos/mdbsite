const modules = require ('/Users/nikita/Desktop/my_project/custom_modules/modexp.js');
const router = express.Router();
const url =  'mongodb://localhost:27017/my_project';
const dbName = 'my_project';

var store = new MongoDBStore({
  uri: 'mongodb://localhost:27017/my_project',
  collection: 'usersSessions'
});

const { check, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

var csrfProtection = csrf({ cookie : true });
store.on('connected', function() {
  store.client;
});

// ДОРАБОТАТЬ!!!! (проверить)

// router.post('/', csrfProtection, function (req, res, next) {
//   if (req.session.userId && req.session.userLogin) {
//   let id = req.session.userId;
//   let login = req.session.userLogin;
//     MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
//       let db = client.db(dbName);
//       db.collection('users').find({login: login}).toArray(function (err, result) {
//         res.render('pages/allusersdata', {csrfToken: req.csrfToken(), dataF: result, title: 'Ваша страница' });
//       });
//       client.close();
//       });
//   } else next();
// });


router.get('/', csrfProtection, function (req, res, next) {
  const stat = new Promise(function (fulfill, reject){
      fs.stat("/Users/nikita/Desktop/my_project/views/pages/mongo.ejs", function (err, stats){
        let lastM = Date.parse(stats.mtime);
        if (err) reject(err);
        else fulfill(lastM);
      });
    });
  stat.then(function(value) {
    if (req.headers['if-modified-since'] === value) {
      res.status(304);
    } else {
      let errors;
      res.status(200);
      res.header('Cache-Control', 'no-cache');
      res.set('Last-Modified', value);
      res.render('pages/mongo', {csrfToken: req.csrfToken(), errors: validationResult(req).array(), title: 'Страница входа и регистрации'}).end();
    }
  });
});

router.post('/',  csrfProtection, [
check('phone', 'Вы не ввели номер телефона').isInt().trim().blacklist('{}@$%<>').not().isEmpty(),
check('userLogin', 'Вы не ввели логин').trim().blacklist('{}@$%<>').not().isEmpty(),
check('userName', 'Вы не заполнили поле Имя').trim().blacklist('{}@$%<>').not().isEmpty(),
check('userPass', 'Вы не заполнили поле Пароль').trim().blacklist('{}@$%<>').not().isEmpty(),
check('userAge', 'Вы не заполнили поле Возраст').trim().blacklist('{}@$%<>').not().isEmpty(),
check('confirm', 'Вы не заполнили поле Подтверждения пароля').blacklist('{}@$%<>').trim().not().isEmpty(),
check('userAge', 'Вы ввели слишком большое число').isInt({min:1, max:99}),
check('userLogin', 'Длинна логина не может быть короче 3 и длиннее 15 символов.').isLength({min:3, max:15}),
check('userName', 'Длинна имени не может быть короче 3 и длиннее 10 символов.').isLength({min:3, max:15}),
check('userPass', 'Длинна пароля не может быть короче 6 символов.').isLength({min:6})
], function (req, res) {
let errors = validationResult(req);
if (errors.array().length !== 0) {
  res.render('pages/mongo', {csrfToken: req.csrfToken(), errors: errors.array(), title: 'Страница входа и регистрации'});
} else {
  const phoneNumber = req.body.phone;
  const login = req.body.userLogin;
  const name = req.body.userName;
  const pass = req.body.userPass;
  const age = req.body.userAge;
  const confirmPass = req.body.confirm;
  const currentDate = new Date();
  if (pass !== confirmPass) {
    res.render('pages/errorall', {title: 'Ошибка', error: 'Поля пароль и подверждение пароля не совпадают.'});
  } else {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
      let db = client.db(dbName);
        db.collection('users').find({login: login}).toArray(function (err, result) {
            if (!result[0]) {
              let verToken;
              const randomToken = new Promise(function (fulfill, reject){
              crypto.randomBytes(5, (err, buf) => {
                verToken = buf.toString('hex');
                if (err) reject(err);
                else fulfill(verToken);
              });
            });
            randomToken.then(function(value) {
              var sms = new SMS('xxxxxxxxxxxx');
              sms.sms_send({
                to: phoneNumber,
                text: `Код подтверждения_${verToken}`,
                }, function(e){
                  console.log(e.description);
              });
              bcrypt.hash(pass, null, null, function(err, hash) {
                db.collection('users').insertOne({
                  phoneNumber: phoneNumber,
                  login: login,
                  name: name,
                  password: hash,
                  age: age,
                  token: verToken,
                  createdAt: currentDate
                }, function (err, res) {
                  });
                  client.close();
                  req.flash("success", "В течении нескольких минут на ваш телефон придет СМС с кодом подтверждения.");
                  res.redirect('/isit');
                });
              });

            } else {
              client.close();
              req.flash('warning', "Пользователь с таким логинон уже существует.");
              res.redirect('/iam');
            }
        });
      });
    }
  }

});

module.exports = router;
