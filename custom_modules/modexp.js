module.exports =
                  express = require('express');
                  app = express();
                  http = require('http');
                  server = http.createServer(app);
                  helmet = require('helmet');
                  cookieParser = require('cookie-parser');
                  session = require('express-session');
                  cookieSession = require('cookie-session');
                  MongoDBStore = require('connect-mongodb-session')(session);
                  csrf = require('csurf');
                  path = require('path');
                  bodyParser = require("body-parser");
                  multer  = require('multer');
                  bcrypt = require('bcrypt-nodejs');
                  GridFsStorage = require('multer-gridfs-storage');
                  crypto = require('crypto');
                  fs = require('fs');
                  Grid = require('gridfs-stream');
                  mongodb = require('mongodb');
                  ObjectID = require('mongodb').ObjectID;
                  MongoClient = require('mongodb').MongoClient;
                  Promise = require('promise');
                  flash = require('connect-flash');
                  expressMessages = require('express-messages');
                  SMS = require('sms_ru');
                  morgan = require('morgan');
                  // const { check, validationResult } = require('express-validator/check');
                  // const { sanitizeBody } = require('express-validator/filter');
