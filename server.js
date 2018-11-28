const modules = require ('/Users/nikita/Desktop/my_project/custom_modules/modexp.js');
const app = express();
let port = process.env.PORT || 8080;
//URL для MongoDB
const url = 'mongodb://localhost:27017';
const uri = 'mongodb://localhost:27017/my_project';
//Поключение к базе данных
const dbName = 'my_project';
//const db = client.db(dbName);
var store = new MongoDBStore({
  uri: 'mongodb://localhost:27017/my_project',
  collection: 'usersSessions'
});

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    styleSrc:
      ["'self'",
      "'unsafe-inline'",
      'maxcdn.bootstrapcdn.com',
      'http://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,700']
  }
}));
app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.xssFilter());
//app.use(helmet.noCache({'Cache-Control': 'no-cache'}));
app.use(express.static('./public'));
app.set('view engine', 'ejs');

app.use(session({
  name: 'action',
  secret: 'Vary strange',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 },// 1 week
  user: {autor: true},
  httpOnly : true,
  store: store,
  secure: false,
  resave: false,
  saveUninitialized: false
}));
// создаем парсер для данных application/x-www-form-urlencoded

app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
var csrfProtection = csrf({ cookie : true });
store.on('connected', function() {
  store.client; // The underlying MongoClient object from the MongoDB driver
});


app.get('/', function(req, res) {
  res.render('pages/post',{title: 'Запрос POST'});
});

app.post('/index', function (req, res) {
  if(!req.body) return res.sendStatus(400);
  res.render('pages/index',{
  title: "POST-запрос",
  name:req.body.userName,
  age:req.body.userAge
  });
});



let data;
app.get('/iam', csrfProtection, function(req, res) {
  //console.log(req.headers);
  let id = req.session.userId;
  let login = req.session.userLogin;
  if (id && login) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
      const db = client.db(dbName);
      db.collection('users').find({login: login}).toArray(function (err, result) {
        data = result[0].id_img;
        res.render('pages/allusersdata', {dataF: result, title: 'Ваша страница' });
      });
      client.close();
      });
  } else {
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
        res.status(200);
        res.header('Cache-Control', 'no-cache');
        res.set('Last-Modified', value);
        res.render('pages/mongo', {csrfToken: req.csrfToken(), title: 'Страница входа и регистрации'}).end();
      }
      //console.log(req.headers['if-modified-since']);
    });
    /*fs.stat("/Users/nikita/Desktop/my_project/views/pages/mongo.ejs", function(err, stats){
      let lastM = Date.parse(stats.mtime);
    });*/
      //res.set('Last-Modified', lastM);

  }
});


app.post('/datamongo', csrfProtection, function (req, res) {
  const login = req.body.userLogin;
  const name = req.body.userName;
  const pass = req.body.userPass;
  const age = req.body.userAge;
  //const cook_csrf = req.cookies._csrf;
  //const client_csrf = req.body;
//console.log(cook_csrf);
  if (!name || !pass || !login || !age) {
    console.log('Bad request (400)');
    res.render('pages/errorall', {title: 'Ошибка', error: 'Вы допустили страшную ошибку и не ввели данные в форму.'});
  } else {
      MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        const db = client.db(dbName);
        db.collection('users').find({login: login}).toArray(function (err, result) {
            if (!result[0]) {
              bcrypt.hash(pass, null, null, function(err, hash) {
                db.collection('users').insertOne({
                  login: login, //req.body.userLogin,
                  name: name, //req.body.userName,
                  password: hash,
                  age: age, //req.body.userAge
                }, function (err, res) {
                  //console.log(res.ops);
                  });
                  client.close();
                  res.render('pages/log_in', {title: "Вход в систему"});
                });
            } else {
              client.close();
              console.log('Bad request (400)');
              res.render('pages/errorall', {title: 'Ошибка', error: 'Пользователь с таким логином уже существует'});
            }
        });
      });
    }
});

//let login;
  app.post('/onlyone', function(req, res) {
    let login = req.body.userLogin;
    let pass = req.body.userPass;
    //console.log(req.session);
    if(!login || !pass) {
      console.error('Bad request (400)');
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
        //console.log(value);
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
                //console.log(resul);
                bcrypt.compare(pass, resul[0].password, function(er, resultat) {
                  if (resultat === true) {
                    req.session.userId = resul[0]._id;
                    req.session.userLogin = resul[0].login;
                    //data = resul[0].id_img;
                    console.log(resul);
                    res.render('pages/allusersdata', {dataF: resul, title: 'Ваша страница' });
                  } else {
                    console.log('Bad request (400)');
                    res.render('pages/errorall', {title: 'Ошибка', error: 'Неверный логин или пароль'});
                  }
                  });
              } else {
                //client.close();
                console.log('Bad request (400)');
                res.render('pages/errorall', {title: 'Ошибка', error: 'Неверный логин или пароль'});
              }
          });
          client.close();
        });
      }
    });
        }
        //console.log(req.headers['if-modified-since']);
      });


        /*MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        const db = client.db(dbName);
        db.collection('users').find({login: login}).toArray(function (err, resul) {
            if (resul[0]) {
              //console.log(resul);
              bcrypt.compare(pass, resul[0].password, function(er, resultat) {
                if (resultat === true) {
                  req.session.userId = resul[0]._id;
                  req.session.userLogin = resul[0].login;
                  //data = resul[0].id_img;
                  console.log(resul);
                  res.render('pages/allusersdata', {dataF: resul, title: 'Ваша страница' });
                } else {
                  console.log('Bad request (400)');
                  res.render('pages/errorall', {title: 'Ошибка', error: 'Неверный логин или пароль'});
                }
                });
            } else {
              //client.close();
              console.log('Bad request (400)');
              res.render('pages/errorall', {title: 'Ошибка', error: 'Неверный логин или пароль'});
            }
        });
        client.close();
      });
    }
  });*/

  /*var storage = new GridFsStorage({
    url: uri,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });
  app.post('/loadimage', upload.single('imageFile'), function (req, res) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
      const db = client.db(dbName);
    db.collection('users').updateOne(
        { login : login},
        { $push: { 'id_img': req.file.id } }
     );
     client.close();
   });
   res.redirect('/findimagename');
  });


  app.get('/findimagename', function (req, res){
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
      const db = client.db(dbName);
      db.collection('users').find({login: login}).toArray(function (err, resul) {
        res.render('pages/allusersdata', {
          dataF: resul,
          title: 'Ваша страница'
        });
      });
      client.close();
    });
  });

  app.get('/image/:id', function (req, res){
    const imageId = req.params.id;
    const imageObj = new ObjectID(imageId);
    MongoClient.connect(url, {useNewUrlParser: true}, function(error, client) {
      const db = client.db(dbName);
      const bucket = new mongodb.GridFSBucket(db, {
        bucketName: 'uploads'
      });
  bucket.openDownloadStream(imageObj)
  .pipe(res);
    });
  });
*/

const storag = multer.diskStorage({
  destination:'/Users/nikita/Desktop/my_project/public/uploads',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() +  path.extname(file.originalname));
  }
});

const upl = multer({
  storage: storag,
  limits:{fileSize: 10000000}
}).single('imageFile');

app.post("/loadimage", function (req, res) {
  upl(req, res, function (err) {
    if (err) {
      console.log('error');
    } else {
      MongoClient.connect(url, {useNewUrlParser: true}, function(error, client) {
        const db = client.db(dbName);
        db.collection('users').updateOne(
            { login : req.session.userLogin},
            { $push: { 'imgname': req.file.filename } }
         );
         db.collection('users').find({login: req.session.userLogin}).toArray(function (err, resul) {
           res.render('pages/allusersdata', {
             dataF: resul,
             title: 'Ваша страница'
           });
           client.close();
         });
        //client.close();
      });
    }
  });

});

app.get('/deleteImg/:name', function (requ, resp) {
  let delImgname = requ.params.name;
  fs.stat(`/Users/nikita/Desktop/my_project/public/uploads/${delImgname}`, function (err, stats) {
     if (stats) {
       fs.unlink(`/Users/nikita/Desktop/my_project/public/uploads/${delImgname}`,function(err){
          if(err) return console.log(err);
          console.log('file deleted successfully');
     });
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
    const db = client.db(dbName);
    db.collection('users').updateOne({"login":requ.session.userLogin}, {'$pull': {"imgname": delImgname}});
    client.close();
  });
};
  return console.error(err);
  });
  resp.redirect('/iam');
});


/*app.get('/deleteImg/:name', function (requ, resp) {
  let delImgid = new ObjectID(requ.params.id);
  let userLog = requ.session.userLogin;
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
    const db = client.db(dbName);
    db.collection('users').updateOne({"login":userLog}, {'$pull': {"id_img": delImgid}});
    db.collection('uploads.files').deleteOne({"_id": delImgid});
    db.collection('uploads.chunks').deleteOne({"files_id": delImgid});
    client.close();
  });
  resp.redirect('/iam');
});
*/
app.get('/logout', function (req, res) {
  if(req.session) {
  req.session.destroy(function() {
    res.redirect('/iam');
  });
  } else {
    res.redirect('/iam');
  }
});


app.listen(port);
console.log(`Приложение запущено! Смотрите на http://localhost:${port}`);
