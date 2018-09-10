const path = require('path');

module.exports = function(req, file, cb) {
  var isImage = ['.jpeg', '.jpg', '.gif', '.png', '.apng', '.svg', '.bmp', '.ico'].includes(path.extname(file.originalname).toLowerCase());
  if(isImage){
    cb(null, true);
  } else {
    cb(new Error('The uploaded file is not an acceptable image type.'), false);
  }
};
