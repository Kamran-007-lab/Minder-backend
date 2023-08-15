const express = require("express");
const router = express.Router();
const fetchuser = require("../middleware/fetchuser");
const Profile = require("../models/Profile");
const { body, validationResult } = require("express-validator");
const multer = require("multer");

// ROUTE 1: Get user profile details using: GET "api/profile/getprofile" - Login Required
router.get("/getprofile", fetchuser, async (req, res) => {
  let success = false;
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (profile) {
      success = true;
      res.json({ success, profile });
    } else {
      res.json({ success, profile: null });
    }
  } catch (error) {
    success = false;
    res.status(500).send({ success, error: "Internal server error !" });
  }
});

// Defining profile images destination folder
const Storage = multer.diskStorage({
  destination: "profileImages",
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  },
});

//image upload middleware
const upload = multer({
  storage: Storage,
}).single("profileImg");

// ROUTE 2: Add user profile details using: POST "api/profile/createprofile" - Login Required
router.post(
  "/createprofile",
  upload,
  fetchuser,
  [
    body("first_name", "First name must be of minimum length 3")
      .isLength({ min: 3 })
      .isAlpha(),
    body("last_name", "Last name must be of minimum length 2")
      .isLength({ min: 2 })
      .isAlpha(),
    body("username", "Username must be of minimum length 3").isLength({
      min: 3,
    }),
  ],
  async (req, res) => {
    let success = false;
    try {
      // Check whether username is already taken
      let user = await Profile.findOne({ username: req.body.username });
      if (user) {
        success = false;
        return res
          .status(400)
          .json({ success, error: "Username already in use, try another !" });
      }

      //   If there are errors return bad request and the errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        success = false;
        return res.status(400).json({ success });
      }

      const profile = new Profile({
        username: req.body.username,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        gender: req.body.gender,
        dating_prefrence: req.body.dating_prefrence,
        bio: req.body.bio,
        date_of_birth: req.body.date_of_birth,
        image: req.file.filename,
        user: req.user.id,
      });
      const userProfile = await profile.save();
      success = true;
      res.json({ success, userProfile });
    } catch (error) {
      success = false;
      res.status(500).send({ success, error: "Internal server error !" });
    }
  }
);

// ROUTE 3: Update user profile details using: PUT "api/profile/updateprofile/:id" - Login Required
router.put("/updateprofile/:id", fetchuser, async (req, res) => {
  try {
    const { username, first_name, last_name } = req.body;

    //Create New profile details object
    const newProfile = {};

    if (username) {
      newProfile.username = username;
    }
    if (first_name) {
      newProfile.first_name = first_name;
    }
    if (last_name) {
      newProfile.last_name = last_name;
    }

    //Find the profile to be updated and check if it is the same user's profile
    let profile = await Profile.findByIdAndUpdate(req.params.id);
    if (!profile) {
      return res.status(404).send("Not found");
    }

    if (profile.user.toString() !== req.user.id) {
      return res.status(401).send("Not allowed");
    }

    profile = await Profile.findByIdAndUpdate(
      req.params.id,
      { $set: newProfile },
      { new: true }
    );
    res.json({ profile });
  } catch (error) {
    res.status(500).send("Internal server error !");
  }
});

// ROUTE 4: Get all user profiles except own using: GET "api/profile/getallprofile" - Login Required
router.get("/getallprofile", fetchuser, async (req, res) => {
  let success = false;
  try {
    const ownprofile = await Profile.findOne({ user: req.user.id });
    const profiles = await Profile.find();
    const index = profiles.findIndex(
      (profile) => profile.username === ownprofile.username
    );
    console.log(index);
    if (index !== -1) {
      profiles.splice(index, 1);
    }

    success = true;
    res.json({ success, profiles });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ success, error: "Internal server error !" });
  }
});

// ROUTE 5: Get specific user profile details using: GET "api/profile/getprofile/:id" - Login Required
router.get("/getprofile/:id", fetchuser, async (req, res) => {
  let success = false;
  try {
    const profile = await Profile.findById(req.params.id);
    if (profile) {
      success = true;
      res.json({ success, profile });
    } else {
      res.json({ success, profile: null });
    }
  } catch (error) {
    success = false;
    res.status(500).send({ success, error: "Internal server error !" });
  }
});

module.exports = router;
