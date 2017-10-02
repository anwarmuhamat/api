const express       = require('express'),
  app               = express(),
  bodyParser        = require('body-parser'),
  logger            = require('morgan'),
  router            = require('./router'),
  mongoose          = require('mongoose'),
  Promise           = require('bluebird'),
  config            = require('./config/main'),
  passport          = require('passport'),
  passportService   = require('./config/passport');

const ROLE_MEMBER   = require('./constants').ROLE_MEMBER,
      ROLE_CLIENT   = require('./constants').ROLE_CLIENT,
      ROLE_OWNER    = require('./constants').ROLE_OWNER,
      ROLE_ADMIN    = require('./constants').ROLE_ADMIN;

// Database Setup
mongoose.Promise = global.Promise;
mongoose.connect(config.database);
const conn          = mongoose.connection;
const multer        = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid          = require('gridfs-stream');
Grid.mongo          = mongoose.mongo;
const gfs           = Grid(conn.db);
const url           = 'http://35.201.139.199:3000';

// Middleware to require login/auth
const requireAuth   = passport.authenticate('jwt', { session: false });
const requireLogin  = passport.authenticate('local', { session: false });

const User = require('./models/user');
const setUserInfo = require('./helpers').setUserInfo;

const Post = require('./models/post');
const setPostInfo = require('./helpers').setPostInfo;

// Start the server
let server;
server = app.listen(config.port);
console.log(`Server is running on port ${config.port}.`);

// Enable CORS from client-side
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Setting up basic middleware for all Express requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger('dev'));

/** Setting up storage using multer-gridfs-storage */
const storage = GridFsStorage({
    gfs : gfs,
    filename: function (req, file, cb) {
        const datetimestamp = Date.now();
        cb(null, req.user._id.toString() + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1]);
    },
    /** With gridfs we can store aditional meta-data along with the file */
    metadata: function(req, file, cb) {
        cb(null, { originalname: file.originalname, uploaded_by: req.user._id.toString()});
    },
    //root name for collection to store files into
    root: 'box'
});

//multer settings for single upload
const upload = multer({
    storage: storage
}).single('file');

/** API path that will upload the files */
app.post('/api/file/upload/changeuserpicture', requireAuth, (req, res, next) => {
    const userId = req.user._id.toString()
    upload(req,res,function(err){
        if(err){
             res.status(422).json({code:422, message:err});
             return;
        }

        User.findById(userId, (err, user) => {
          if (err) {
            res.status(400).json({ code:400, message: 'No user could be found for this ID.' });
            return next(err);
          }

          user.profile.picture.url = url+'/api/file/'+req.file.filename;
          user.profile.picture.id  = req.file.id;

          user.save((err, user) => {
            if (err) {
              if (err.name == 'ValidationError') {
                  res.status(422).json({
                    code: 422,
                    info: err
                  });
              }
            }else {
              const userToReturn = setUserInfo(user);
              res.status(201).json({
                code: 201,
                message: 'Successfully updated.',
                user: userToReturn
              });
            }
          });
        });
    });
});

app.post('/api/file/upload/picture', requireAuth, (req, res, next) => {
    const userId = req.user._id.toString()
    upload(req,res,function(err){
        if(err){
             res.status(422).json({code:422, message:err});
             return;
        }

        const url = url+'/api/file/'+req.file.filename;
        const id  = req.file.id;

        res.status(201).json({
          code: 201,
          message: 'Successfully updated.',
          picture: {_id: id, url: url}
        });

    });
});

app.get('/api/file/:filename', function(req, res){
    gfs.collection('box');
    gfs.files.find({filename: req.params.filename}).toArray(function(err, files){
        if(!files || files.length === 0){
            return res.status(404).json({
                code: 404,
                message: "Not found."
            });
        }
        /** create read stream */
        var readstream = gfs.createReadStream({
            filename: files[0].filename,
            root: "box"
        });
        /** set the proper content type */
        res.set('Content-Type', files[0].contentType)
        /** return response */
        return readstream.pipe(res);
    });
});

// Import routes to be served ok
router(app);
