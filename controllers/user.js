const mongoose = require('mongoose');
const User = require('../models/user');
const setUserInfo = require('../helpers').setUserInfo;

function toObjectId(ids) {
    if (ids.constructor === Array) {
        return ids.map(mongoose.Types.ObjectId);
    }
    return mongoose.Types.ObjectId(ids);
}

// User Routes
exports.allUser = function (req, res, next) {
  const limitval = parseInt(req.query.limit);
  const skipval = parseInt(req.query.skip);

  User.find({}, {name:1, email:1, profile: 1}, {skip:skipval, limit: limitval}, (err, user) => {
    if (err) {
      res.status(400).json({ code:400, message: 'No user could be found.' });
      return next(err);
    }
    return res.status(200).json(user);
  });
};

exports.viewProfile = function (req, res, next) {
  const userId = req.params.userId;

  User.findById(userId, (err, user) => {
    if (err) {
      res.status(400).json({ code:400, message: 'No user could be found for this ID.' });
      return next(err);
    }

    const userToReturn = setUserInfo(user);
    return res.status(200).json([ userToReturn ]);
  });
};

exports.searchUser = function (req, res, next) {
  const name = req.query.name;

  User.find({name: new RegExp(name, "i")}, {name:1, profile: 1}, (err, user) => {
    if (err) {
      res.status(400).json({ code:400, message: 'No user could be found for this ID.' });
      return next(err);
    }
    return res.status(200).json(user);
  });
};

exports.myProfile = function (req, res, next) {
  const userId = req.user._id.toString()

  User.findById(userId, (err, user) => {
    if (err) {
      res.status(400).json({ code:400, message: 'No user could be found for this ID.' });
      return next(err);
    }

    const userToReturn = setUserInfo(user);
    return res.status(200).json({ user: userToReturn });
  });
};

exports.updateLocation = function (req, res, next) {
  const userId = req.user._id.toString()
  const long = req.body.long;
  const lat  = req.body.lat;

  if (!long) {
    return res.status(422).send({ 'code': '422', 'message': 'You must enter a valid longitude.' });
  }

  if (!lat) {
    return res.status(422).send({ 'code': '422', 'message': 'You must enter a valid latitude.' });
  }

  User.findById(userId, (err, user) => {
    if (err) {
      res.status(400).json({ code:400, message: 'No user could be found for this ID.' });
      return next(err);
    }

    user.loc.coordinates = [long, lat];

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
};

exports.findNearbyUsers = function (req, res, next) {
  const loc = req.user.loc;
  const dist = parseFloat(req.query.dist);
  const mindist = parseFloat(req.query.mindist);
  const skipval = parseFloat(req.query.skipval);
  const ids = [];

  User.aggregate([{
     $geoNear: {
        near: loc,
        distanceField: 'dist.calculated',
        minDistance: mindist,
        maxDistance: dist,
        distanceMultiplier: 0.001,
        query: {role: 'Member', _id: {$nin: ids}},
        includeLocs: 'dist.location',
        num: 10,
        spherical: true
     }
   },
   {$project : {name:1, profile:1, phone:1, dist:{calculated:1}}},
   {$skip: skipval},
   {$limit: 10}],
    (err, user) => {
    if (err) {
      res.status(400).json({ code:400, message: 'No user could be found.' });
      return next(err);
    }
    return res.status(200).json(user);
  });
};

exports.addNewPhoneNumber = function (req, res, next) {
  const phone_category = req.body.phone_category;
  const phone_number  = req.body.phone_number;

  if (phone_category.match(/^(Work|Home|Mobile)$/)) {
    User.update({ _id: req.user._id},
      {
        $addToSet: {
          phone: {
            category: phone_category,
            number: phone_number
          }
        }
      },
      (err, user) => {
        if (err) {
          if (err.name == 'ValidationError') {
              res.status(422).json({
                code: 422,
                info: err
              });
          }
        }else {
          res.status(201).json({
            code: 201,
            message: 'Successfully added.'
          });
        }
    });
  }else {
    return res.status(422).send({ code: 422, message: 'You must select a valid phone category [Work, Home, Mobile].' });
  }

};

exports.deletePhoneNumber = function (req, res, next) {
  User.update({ _id: req.user._id},
    {
      $pull: {
        phone: {
          _id: toObjectId(req.body.phone_id)
        }
      }
    },
    (err, user) => {
      if (err) {
        if (err.name == 'ValidationError') {
            res.status(422).json({
              code: 422,
              info: err
            });
        }
      }else {
        res.status(201).json({
          code: 201,
          message: 'Successfully deleted.'
        });
      }
  });
};

exports.updateProfile = function (req, res, next){
  const name = req.body.name;
  const address = req.body.address;
  const userId = req.user._id.toString();

  if (!name) {
    return res.status(422).send({ code: 422, message: 'You must enter your full name.' });
  }

  if (req.user._id.toString() !== userId) {
    return res.status(401).json({ code: 401, message: 'You are not authorized to view this user profile.' });
  }
  User.findById(userId, (err, user) => {
    if (err) {
      res.status(400).json({ code:400, message: 'No user could be found for this ID.' });
      return next(err);
    }

    user.name = name;
    user.address = address;

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

};

exports.updateIsActive = function (req, res, next){
  const active = req.body.active;
  const userId = req.user._id.toString();

  if (!active) {
    return res.status(422).send({ code: 422, message: 'You must select status.' });
  }

  if (req.user._id.toString() !== userId) {
    return res.status(401).json({ code: 401, message: 'You are not authorized to view this user profile.' });
  }
  User.findById(userId, (err, user) => {
    if (err) {
      res.status(400).json({ code:400, message: 'No user could be found for this ID.' });
      return next(err);
    }

    user.active = active;

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

};
