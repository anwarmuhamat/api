const mongoose = require('mongoose');
const Post = require('../models/post');
const setPostInfo = require('../helpers').setPostInfo;

function toObjectId(ids) {
    if (ids.constructor === Array) {
        return ids.map(mongoose.Types.ObjectId);
    }
    return mongoose.Types.ObjectId(ids);
}

exports.addNewPost = function (req, res, next){
  const userId = req.user._id.toString();
  const user_name = req.user.name;
  const user_email = req.user.email;
  const user_phone = req.user.phone;
  const user_picture = req.user.profile.picture;
  const user_address = req.user.address;
  const loc = req.user.loc;

  const title = req.body.title;
  const description = req.body.description;
  const main_picture = req.body.main_picture;
  const qty = req.body.qty;
  const price = req.body.price;
  const user_id = req.user._id;

  if (req.user._id.toString() !== userId) {
    return res.status(401).json({ code: 401, message: 'You are not authorized to add new post.' });
  }

  const post = new Post({
    user_id,
    user_name,
    user_email,
    user_phone,
    user_picture,
    user_address,
    title,
    description,
    main_picture,
    qty,
    price,
    loc
  });

  post.save((err, post) => {
    if (err) {
      if (err.name == 'ValidationError') {
          res.status(422).json({
            code: 422,
            info: err
          });
      }
    }else {
      const postToReturn = setPostInfo(post);
      res.status(201).json({
        code: 201,
        message: 'Successfully saved.',
        post: postToReturn
      });
    }
  });

};

exports.findNearbyPosts = function (req, res, next) {
  const dist = parseFloat(req.query.dist);
  const mindist = parseFloat(req.query.mindist);
  const skipval = parseFloat(req.query.skipval);
  const loc = req.user.loc;
  const ids = [];

  Post.aggregate([{
     $geoNear: {
        near: loc,
        distanceField: 'dist.calculated',
        minDistance: mindist,
        maxDistance: dist,
        distanceMultiplier: 0.001,
        query: {_id: {$nin: ids}},
        includeLocs: 'dist.location',
        num: 10,
        spherical: true
     }
   },
   {$project : {
     _id:1, user_id:1, user_name:1, user_phone:1, user_email:1, user_picture:1,
     user_address:1, title:1, description:1, main_picture:1, qty:1, price:1, dist:{calculated:1}
   }},
   {$skip: skipval},
   {$limit: 10}],
    (err, post) => {
    if (err) {
      res.status(400).json({ code:400, message: 'No near by foods yet.' });
      return next(err);
    }
    return res.status(200).json(post);
  });
};
