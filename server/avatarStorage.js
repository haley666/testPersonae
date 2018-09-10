const multer = require('multer'),
  uuid = require('uuid/v4');
  path = require('path');

module.exports = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, './data/avatars');
  },

  filename: function(req, file, cb){
    var extension = path.extname(file.originalname);
    var name = uuid();
    cb(null, name + extension);
  }
});