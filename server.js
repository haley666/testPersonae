//  OpenShift sample Node application
const express = require('express'),
    avatarStorage = require('./server/avatarStorage'),
    imgFilter = require('./server/imgFilter'),
    handlebars = require('express-handlebars'),
    navItems = require('./server/navItems'),
    morgan  = require('morgan'),
    mongodb = require('mongodb');
    multer = require('multer'),
    path    = require('path'),
    app     = express(),
    upload = multer({storage: avatarStorage, fileFilter: imgFilter });
var variable = 0;
    variableD = 0;

Object.assign=require('object-assign')

// Use handlebars template engine
app.set('views', __dirname+'/src/views');
app.engine('handlebars', handlebars({layoutsDir: 'src/views/layouts', defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// Serve static files from specific folders folder
app.use('/assets', express.static('./build/assets'));
app.use('/avatars', express.static('./data/avatars'));

// Server logging
app.use(morgan('combined'));

// middleware for nav items
app.use(function(req, res, next){
  navItems.forEach(function(item){
    item.active = req.path.match(item.pattern) ? true : false;
  });
  next();
});

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = '';

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}
var db = null,
    dbDetails = new Object();


var initDb = function(callback) {
  if (mongoURL == null) {
    console.log("Cannot connect to MongoDB. No URL provided.");
    return;
  }



  if (mongodb == null) {
    console.log("Cannot connect to MongoDB. No client instance is present.");
    return;
  }

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }
    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';
    console.log('Connected to MongoDB at: %s', dbDetails.url);
  });
};

// TODO break out route handlers into separate js files for organization

app.get('/', function (req, res) {
  db.collection('personas').find({}).toArray(function(err, result){
    if (err) throw err
    personas = result;
    console.log('All personas successfully loaded');
    res.render('home', {personas: result, navItems});
  });
});

app.get('/persona/:id/card', function(req, res){
  var id = new mongodb.ObjectID(req.params.id);
  db.collection('personas').find({ _id: id }).toArray(function(err, result){
    if(err) throw err;
    if(result.length > 0){
      res.render('persona-card', {persona: result[0], navItems});
    } else {
      res.render('404');
    }
  });
});

app.get('/persona/:id/details', function(req, res){
  // TODO retrieve persona from mongodb
  var id = new mongodb.ObjectID(req.params.id);
  db.collection('personas').find({ _id: id }).toArray(function(err, result){
    if(err) throw err;
    if(result.length > 0){
      res.render('persona-details', {persona: result[0], navItems});
      //console.log("*******"+id);
    } else {
      res.render('404');
    }
  });
})

app.get('/create', function(req, res){
  res.render('create-persona', {navItems});
});

app.post('/create', upload.single('photo'), function(req, res){
  var persona = {};
  persona.name = req.body.name;
  persona.jobTitle = req.body.jobTitle;
  persona.backgrounds = req.body.backgrounds;
  persona.keysToSuccess = req.body.keysToSuccess;
  persona.dangers = req.body.dangers;
  persona.quote = req.body.quote;
  persona.network = req.body.quote;
  console.log(req.body.quote);
  if(!req.file) {
    persona.photo = '/opt/app-root/src/data/avatars/default.png';
  }
  else {
    persona.photo = '/avatars/' + req.file.filename;
  }
  // persona.photo = '/avatars/' + req.file.filename;
  persona.network = req.body.network;
  persona.dayInTheLife = {};
  persona.skills = [];
  persona.dayInTheLife.summary = req.body.dayInTheLife;

  //Origin code of getting value of the slider
  req.body.skills.forEach(function(skill, index){
    persona.skills.push({
      name: skill,
      rating: req.body.ratings[index]
    });
  });

  //Begin -- Get radio buttons' value
  //var j = 1;
  // req.body.skills.forEach(function(skill){
  //   //var ratingName = 'ratings' + j;
  //   // console.log(ratingName);
  //   var radios = document.getElementsByName('ratings');
  //   for (var i = 0, length = radios.length; i < length; i++) {
  //     if (radios[i].checked) {
  //       // do whatever you want with the checked radio
  //       //alert(radios[i].value);
  //       // only one radio can be logically checked, don't check the rest
  //     break;
  //     }
  //   }
  //   j++;
  //   //index = radios[i].value;
  //   persona.skills.push({
  //     name: skill,
  //     rating: radios[i].value;
  //   });
  // });


  db.collection('personas').insertOne(persona, function(err, res){
    if (err) throw err;
  });
  res.redirect('/');
});

//Edit Start
app.get('/persona/:id/edit', function(req, res){
  // TODO retrieve persona from mongodb
  var id = new mongodb.ObjectID(req.params.id);
  db.collection('personas').find({ _id: id }).toArray(function(err, result){
    if(err) throw err;
    if(result.length > 0){
      res.render('edit-persona', {persona: result[0], navItems});
    } else {
      res.render('404');
    }
  });
  variable = id;
});

//Upload new data
app.post('/persona/:id/edit', upload.single('photo'), function(req, res){
  var persona = {};
  persona.name = req.body.name;
  persona.jobTitle = req.body.jobTitle;
  console.log("***************"+req.body.name);
  persona.backgrounds = req.body.backgrounds;
  persona.keysToSuccess = req.body.keysToSuccess;
  persona.dangers = req.body.dangers;
  persona.quote = req.body.quote;
  persona.network = req.body.quote;
  if(req.file) {
    persona.photo = '/avatars/' + req.file.filename;
  }
  persona.network = req.body.network;
  persona.dayInTheLife = {};
  persona.skills = [];
  persona.dayInTheLife.summary = req.body.dayInTheLife;
  req.body.skills.forEach(function(skill, index){
    persona.skills.push({
      name: skill,
      rating: req.body.ratings[index]
    });
  });

  db.collection('personas').updateOne({ _id: variable }, {$set: persona}, function(err, res){
    if (err) throw err;
  });

  res.redirect('/');
});
//Edit End

//Delete Start
app.get('/persona/:id/delete', function(req, res){
  // TODO retrieve persona from mongodb
  var id = new mongodb.ObjectID(req.params.id);
  db.collection('personas').deleteOne({ _id: id }, function(err, res){
    if (err) throw err;
    console.log("*************ID: "+id+"has successfully been removed")
  });
  db.collection('personas').find({}).toArray(function(err, result){
    if (err) throw err;
    personas = result;
    console.log('All personas successfully loaded');
    res.render('home', {personas: result, navItems});
  });
})
//Delete End

//error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app;
