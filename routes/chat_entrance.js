const modules = require ('/Users/nikita/Desktop/my_project/custom_modules/modexp.js');
const router = express.Router();

router.get('/', function(req, res) {
  res.render('/Users/nikita/Desktop/my_project/views/pages/chat_entrance.ejs');
});

module.exports = router;
