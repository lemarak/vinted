const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    console.log("On passe dans le middleware");
    // get token
    if (!req.headers.authorization) {
      return res.status(401).json("Pas de token");
    }
    const token = req.headers.authorization.replace("Bearer ", "");
    // get user with token
    const user = await User.findOne({ token: token });
    if (user) {
      req.user = user;
      next();
    } else {
      res.status(401).json("Non autorisé");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = isAuthenticated;
