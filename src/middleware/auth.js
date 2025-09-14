const { verifyToken } = require('../utils/jwt');
const {User} = require("../models");

const authenticate = async (req, res, next) => {
  try {
     let token = req.cookies.token;
     //console.log("Access Token", token);
     if(!token){
        return res.status(401).json({message: "Access Token Required"});
     }
     let decoded = verifyToken(token);
     
     if (!decoded) {
       return res.status(401).json({ message: 'Invalid token' });
     }
     let user = await User.findByPk(decoded.id);
    //  console.log('User found:', user);
     if (!user) {
       return res.status(401).json({ message: 'User not found' });
     }

     req.user = user;
     next();
  } catch (error) {
    console.log('Authentication error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = authenticate;
