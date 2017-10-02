const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    user_name: {
        type: String,
        required: true
    },
    user_email: {
      type: mongoose.SchemaTypes.Email,
      lowercase: true,
      unique: true,
      required: true
    },
    user_picture: {
      url: {
        type: String,
      }
    },
    user_phone: [{
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
    user_address: {
      type: String,
      minlength: 7,
      maxlength: 140
    },
    title: {
      type: String,
      required: true,
      minlength: 5,
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 160
    },
    main_picture: {
      id: {
        type: String,
        default: '593247008d4926360077938e'
      },
      url: {
        type: String,
        default: 'http://139.59.103.121:3000/api/file/5932469241aa6235e5f4e6bb1496467200235.png'
      }
    },
    pictures: [{
      id: {
        type: String
      },
      url: {
        type: String
      }
    }],
    qty: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    loc: {
          type: {
              type: String,
              required: true,
              enum: ['Point', 'LineString', 'Polygon'],
              default: 'Point'
          },
          coordinates: {
            type: [Number]
          }
    },
    active: {
      type: Boolean,
      default: true
    }
},
{
  timestamps: true
});

PostSchema.index({ 'loc': '2dsphere' });
module.exports = mongoose.model("Post", PostSchema);
