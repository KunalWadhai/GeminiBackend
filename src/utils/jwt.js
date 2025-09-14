const jwt = require('jsonwebtoken');

// const generateToken = (userId) => {
//   return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
//     expiresIn: '7d'
//   });
// };

const generateToken = (userId) => {
  let token = jwt.sign({id: userId}, process.env.JWT_SECRET);
  return token;
}

const verifyToken = (token) => {
  try {
    let decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};
