const modules = require ('/Users/nikita/Desktop/my_project/custom_modules/modexp.js');
const router = express.Router();
const url =  "mongodb://localhost:27017";
const dbName = 'my_project';


const storag = multer.diskStorage({
  destination:'/Users/nikita/Desktop/my_project/public/uploads',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() +  path.extname(file.originalname));
  }
});

const upl = multer({
  storage: storag,
  limits:{fileSize: 100000000}
}).single('imageFile');

router.get('/', (req, res, next) => {

});

router.post('/loadimage', function (req, res, next) {
  upl(req, res, function (err) {
    if (err) {
      req.flash('danger', "Произошел сбой. Пожалуйста, попробуйте загрузить изображение еще раз.");
      res.redirect('/iam');
    } else {
      MongoClient.connect(url, {useNewUrlParser: true}, function(error, client) {
        const db = client.db(dbName);
        db.collection('users').updateOne(
            { login : req.session.userLogin},
            { $push: { 'imgname': req.file.filename } }
         );
           client.close();
         });
        req.flash('primary', "Изображение добавленно на страницу");
        res.redirect('/iam');
      }
    });
  });

router.get('/deleteImage/:name', function (req, res, next) {
  let delImgname = req.params.name;
  fs.stat(`/Users/nikita/Desktop/my_project/public/uploads/${delImgname}`, function (err, stats) {
     if (stats) {
       fs.unlink(`/Users/nikita/Desktop/my_project/public/uploads/${delImgname}`,function(err){
          if(err) return console.log(err);
          console.log('file deleted successfully');
     });
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
    const db = client.db(dbName);
    db.collection('users').updateOne({"login":req.session.userLogin}, {'$pull': {"imgname": delImgname}});
    client.close();
  });
} else {
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
    const db = client.db(dbName);
    db.collection('users').updateOne({"login":req.session.userLogin}, {'$pull': {"imgname": delImgname}});
    client.close();
  });
}
  req.flash("danger", "Изображение удалено");
  res.redirect('/iam');
});
});
module.exports = router;
