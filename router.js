const AuthenticationController = require('./controllers/authentication');
const UserController = require('./controllers/user');
const PostController = require('./controllers/post');
const express = require('express');
const passport = require('passport');
const ROLE_MEMBER = require('./constants').ROLE_MEMBER;
const ROLE_CLIENT = require('./constants').ROLE_CLIENT;
const ROLE_OWNER = require('./constants').ROLE_OWNER;
const ROLE_ADMIN = require('./constants').ROLE_ADMIN;
const passportService = require('./config/passport');

// Middleware to require login/auth
const requireAuth = passport.authenticate('jwt', { session: false });
const requireLogin = passport.authenticate('local', { session: false });

module.exports = function (app) {
  // Initializing route groups
  const apiRoutes = express.Router(),
    authRoutes = express.Router(),
    userRoutes = express.Router();
    postRoutes = express.Router();

  // Set auth routes as subgroup/middleware to apiRoutes
  apiRoutes.use('/auth', authRoutes);
  authRoutes.post('/register', AuthenticationController.register);
  authRoutes.post('/login', requireLogin, AuthenticationController.login);
  authRoutes.post('/forgot-password', AuthenticationController.forgotPassword);
  authRoutes.post('/reset-password/:token', AuthenticationController.verifyToken);

  // Set user routes as a subgroup/middleware to apiRoutes
  apiRoutes.use('/user', userRoutes);
  userRoutes.get('/all', requireAuth, UserController.allUser);
  userRoutes.get('/nearby', requireAuth, UserController.findNearbyUsers);
  userRoutes.get('/profile/:userId', requireAuth, UserController.viewProfile);
  userRoutes.get('/search', requireAuth, UserController.searchUser);
  userRoutes.get('/me', requireAuth, UserController.myProfile);
  userRoutes.put('/update', requireAuth, UserController.updateProfile);
  userRoutes.put('/update/status', requireAuth, UserController.updateIsActive);
  userRoutes.put('/update/location', requireAuth, UserController.updateLocation);
  userRoutes.put('/add/phone', requireAuth, UserController.addNewPhoneNumber);
  userRoutes.delete('/delete/phone', requireAuth, UserController.deletePhoneNumber);

  // Post routes
  apiRoutes.use('/post', postRoutes);
  postRoutes.post('/new', requireAuth, PostController.addNewPost);
  postRoutes.get('/nearby', requireAuth, PostController.findNearbyPosts);

  // Test protected route
  apiRoutes.get('/protected', requireAuth, (req, res) => {
    res.send({ content: 'The protected test route is functional!' });
  });

  apiRoutes.get('/admins-only', requireAuth, AuthenticationController.roleAuthorization(ROLE_ADMIN), (req, res) => {
    res.send({ content: 'Admin dashboard is working.' });
  });

  // Set url for API group routes
  app.use('/api', apiRoutes);
  app.use(function(req, res, next) {
    res.status(404);
    res.send({'code': 404, 'message': 'Not Found'});
});
};
