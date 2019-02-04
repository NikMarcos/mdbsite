const moment = require('moment');

let generateMessage = (from, text) => {
  return { from, text, cretatedAt: moment().valueOf() };
};

module.exports = {generateMessage};
