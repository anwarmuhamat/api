const mongoose = require('mongoose');
require('mongoose-type-email');
const bcrypt = require('bcrypt-nodejs');
const ROLE_MEMBER = require('../constants').ROLE_MEMBER;
const ROLE_CLIENT = require('../constants').ROLE_CLIENT;
const ROLE_OWNER = require('../constants').ROLE_OWNER;
const ROLE_ADMIN = require('../constants').ROLE_ADMIN;

const Schema = mongoose.Schema;
const box_url = 'http://35.201.139.199';

// User Schema
const UserSchema = new Schema({
  email: {
    type: mongoose.SchemaTypes.Email,
    lowercase: true,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    minlength: 3
  },
  phone: [{
    category: {
      type: String,
      required: true,
      enum: ['Mobile', 'Home', 'Work'],
      default: 'Mobile'
    },
    number: {
      type: String,
      required: true,
      minlength: 9,
      maxlength: 13
    }
  }],
  address: {
    type: String,
    minlength: 7,
    maxlength: 140
  },
  profile: {
    picture: {
      id: {
        type: String,
        default: '59d1fe3c244a0561608f280c'
      },
      url: {
        type: String,
        default: box_url+'/api/file/59d1fddc244a0561608f280a1506934332160.jpg'
      }
    }
  },
  loc: {
        type: {
            type: String,
            required: true,
            enum: ['Point', 'LineString', 'Polygon'],
            default: 'Point'
        },
        coordinates: {
          type: [Number],
          default: [112.056367,-8.128597]
        }
  },
  role: {
    type: String,
    enum: [ROLE_MEMBER, ROLE_CLIENT, ROLE_OWNER, ROLE_ADMIN],
    default: ROLE_MEMBER
  },
  active: {
    type: Boolean,
    default: true
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
  },
  {
    timestamps: true
  });

// Pre-save of user to database, hash password if password is modified or new
UserSchema.pre('save', function (next) {
  const user = this,
        SALT_FACTOR = 5;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(SALT_FACTOR, (err, salt) => {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, null, (err, hash) => {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

// Method to compare password for login
UserSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    if (err) { return cb(err); }

    cb(null, isMatch);
  });
};

UserSchema.index({ 'loc': '2dsphere' });
module.exports = mongoose.model('User', UserSchema);
