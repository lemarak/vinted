const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;

const router = express.Router();

// import model
const User = require("../models/User");

// Signup
router.post("/user/signup", async (req, res) => {
  try {
    // get body values
    const { email, username, phone, password } = req.fields;
    // console.log(await User.findOne({ email: email }));
    if (await User.findOne({ email: email })) {
      return res
        .status(200)
        .json({ message: `l'email ${email} existe déjà dans la base` });
    }
    if (!username) {
      return res.status(200).json({ message: `username doit être renseigné` });
    }
    // create salt
    const salt = uid2(16);
    // create hash
    const hash = SHA256(salt + password).toString(encBase64);
    // create token
    const token = uid2(64);

    // upload avatar
    const avatar = {};
    if (req.files.avatar) {
      const resultUpload = await cloudinary.uploader.upload(
        req.files.avatar.path,
        {
          folder: "/vinted/users",
        }
      );
      avatar = { secure_url: resultUpload.secure_url };
    }

    // save user
    const newUser = new User({
      email,
      account: { username, phone, avatar },
      token,
      hash,
      salt,
    });
    await newUser.save();

    // display
    result = {
      _id: newUser._id,
      token: token,
      account: { username, phone },
    };
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LogIn
router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.fields;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(400)
        .json({ message: `Utilisateur ${email} non identifié` });
    }
    const newHash = SHA256(user.salt + password).toString(encBase64);
    if (newHash !== user.hash) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    } else {
      const result = {
        _id: user.id,
        token: user.token,
        account: { username: user.account.username, phone: user.account.phone },
      };
      res.status(200).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
