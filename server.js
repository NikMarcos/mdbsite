const modules = require ('/Users/nikita/Desktop/my_project/custom_modules/modexp.js');
const mainPage = require ('/Users/nikita/Desktop/my_project/routes/main_page.js');
const verifyToken = require ('/Users/nikita/Desktop/my_project/routes/verifyToken.js');
const iam = require ('/Users/nikita/Desktop/my_project/routes/iam.js');
const images = require ('/Users/nikita/Desktop/my_project/routes/images.js');
const entrance = require ('/Users/nikita/Desktop/my_project/routes/entrance.js');
const chat = require ('/Users/nikita/Desktop/my_project/routes/chat.js');
const chat_entrance = require ('/Users/nikita/Desktop/my_project/routes/chat_entrance.js');
//const app = express();
let port = process.env.PORT || 8080;
//URL для MongoDB
const url =  'mongodb://localhost:27017/my_project';
//const uri = 'mongodb://simpleUser:simplepass@localhost:27017/?authMechanism=DEFAULT&authSource=my_project';
//Поключение к базе данных
const dbName = 'my_project';
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
      'stackpath.bootstrapcdn.com'
    ]
  }
}));
app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.xssFilter());
app.use(helmet.noCache({'Cache-Control': 'no-cache'}));
app.use(express.static('./public'));
app.set('view engine', 'ejs');

app.use(session({
  name: 'action',
  secret: 'Vary strange',
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 1 week
  user: {autor: true},
  httpOnly : true,
  store: store,
  secure: false,
  resave: false,
  saveUninitialized: false
}));
app.use(cookieParser('secret'));
app.use(bodyParser.urlencoded({extended: false}));

app.use(flash());
app.use(function (req, res, next) {
  res.locals.messages = expressMessages(req, res);
  next();
});
app.use(morgan('dev'));

var csrfProtection = csrf({ cookie : true });
store.on('connected', function() {
  store.client;
});
app.use('/isit', verifyToken);

app.use('/iam', csrfProtection, function (req, res, next) {
  if (req.session.userId && req.session.userLogin) {
  let id = req.session.userId;
  let login = req.session.userLogin;
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
      let db = client.db(dbName);
      db.collection('users').find({login: login}).toArray(function (err, result) {
        res.render('pages/allusersdata', {csrfToken: req.csrfToken(), dataF: result, title: 'Ваша страница' });
      });
      client.close();
      });
  } else next();
});

app.use('/chat', chat);
app.use('/chat_entrance', chat_entrance);
app.use('/', mainPage);

app.use('/iam', iam);

app.use('/image', images);

app.use('/entrance', entrance);


  server.listen(port);
  console.log(`Приложение запущено! Смотрите на http://localhost:${port}`);
