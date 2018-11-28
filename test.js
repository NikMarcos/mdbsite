const express = require('express');
const app = express();
const path = require('path');
var bodyParser = require("body-parser");
var multer  = require('multer');
const bcrypt = require('bcrypt-nodejs');
const GridFsStorage = require('multer-gridfs-storage');
const crypto = require('crypto');
const fs = require('fs');
var Grid = require('gridfs-stream');
var mongodb = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
//URL для MongoDB
const url = 'mongodb://localhost:27017';
const uri = 'mongodb://localhost:27017/test';
//Поключение к базе данных
const dbName = 'test';
//const db = new mongodb.Db('test', new mongodb.Server("127.0.0.1", 27017));


app.use(express.static('./public'));
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  console.log('Hi!');
  res.render('pages/test', {title: 'Тест обновления'});
});

app.get('/remove', function (requ, resp) {
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
    const db = client.db(dbName);
    db.collection('users').updateOne({"login": "Mara"}, { $unset: {"id_img":" "}});
    db.collection('uploads.files').deleteOne({"_id": mongodb.ObjectId('5bc7057cbdf4ce05660b675d')});
    db.collection('uploads.chunks').deleteOne({"files_id": mongodb.ObjectId('5bc7057cbdf4ce05660b675d')});
    client.close();
  });
  resp.redirect('/');
});

app.post('/test', function(req, res) {
  console.log(req.body);
  const login = req.body.userLogin;
  const name = req.body.userName;
  const age = req.body.userAge;
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
    const db = client.db(dbName);
    db.collection('users').insertOne({
      login: login, //req.body.userLogin,
      name: name, //req.body.userName,
      age: age, //req.body.userAge
    }, function (err, res) {
      console.log(res.ops);
      });
  res.render('pages/testfind', {title: 'Тест обновления'});
  client.close();
  });
});

let log;
app.post('/testone', function (req, res){
  log = req.body.userLogin;
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
  const db = client.db(dbName);
  db.collection('users').find({login: log}).toArray(function (err, resul) {
    res.render('pages/testone', {dataF: resul, title: 'Ваша страница' });
  });
  client.close()
  });
});

var storage = new GridFsStorage({
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
let imagename;
app.post('/loadimage', upload.single('imageFile'), function (req, res) {
  //console.log(res);
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
    const db = client.db(dbName);
  db.collection('users').updateOne(
      { login : log},
      { $set: { 'id_img': req.file.id } }
   );

   client.close();
 });
 res.redirect('/findimagename');
});

//написать роут на выдачу изображения из БД

let data;
app.get('/findimagename', function (req, res){
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
    const db = client.db(dbName);
    db.collection('users').find({login: log}).toArray(function (err, resul) {
      data = resul[0].id_img;
      //imagename = resul[0].filename;
      console.log(resul);
      res.render('pages/allusersdata', {dataF: resul, title: 'Ваша страница' });
    });
    client.close();
  });
});
//console.log(data);
app.get('/image', function (req, res){
  MongoClient.connect(url, {useNewUrlParser: true}, function(error, client) {
    const db = client.db(dbName);
    const bucket = new mongodb.GridFSBucket(db, {
  //chunkSizeBytes: 1024,
  bucketName: 'uploads'
  });
  //console.log(data);
bucket.openDownloadStream(data)
.pipe(res);
  //.on('error', function(error) {
  //  assert.ifError(error);
    //});
    //client.close();
  });
});


app.listen(3000);
console.log('Приложение запущено! Смотрите на http://localhost:3000');
