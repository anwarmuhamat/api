const ROLE_MEMBER = require('./constants').ROLE_MEMBER;
const ROLE_CLIENT = require('./constants').ROLE_CLIENT;
const ROLE_OWNER = require('./constants').ROLE_OWNER;
const ROLE_ADMIN = require('./constants').ROLE_ADMIN;

// Set user info from request
exports.setUserInfo = function setUserInfo(request) {
  const getUserInfo = {
    _id: request._id,
    name: request.name,
    email: request.email,
    phone: request.phone,
    picture: request.profile.picture,
    address: request.address,
    location: request.loc,
    role: request.role,
    active: request.active
  };
  return getUserInfo;
};

// Set post info from request
exports.setPostInfo = function setPostInfo(request) {
  const getPostInfo = {
    _id: request._id,
    user_id: request.user_id,
    user_name: request.user_name,
    user_email: request.user_email,
    user_phone: request.user_phone,
    user_picture: request.user_picture,
    user_address: request.user_address,
    title: request.title,
    description: request.description,
    main_picture: request.main_picture,
    pictures: request.pictures,
    qty: request.qty,
    price: request.price,
    active: request.active
  };
  return getPostInfo;
};

exports.getRole = function getRole(checkRole) {
  let role;
  switch (checkRole) {
    case ROLE_ADMIN: role = 4; break;
    case ROLE_OWNER: role = 3; break;
    case ROLE_CLIENT: role = 2; break;
    case ROLE_MEMBER: role = 1; break;
    default: role = 1;
  }
  return role;
};
