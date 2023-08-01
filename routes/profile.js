const express = require("express");
const router = express.Router();
const fetchuser = require("../middleware/fetchuser");
const Profile = require("../models/Profile");
const { body, validationResult } = require("express-validator");

// ROUTE 1: Get user profile details using: GET "api/profile/getprofile" - Login Required
router.get("/getprofile", fetchuser, async (req, res) => {
  try {
    const profile = await Profile.find({ user: req.user.id });
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error !");
  }
});

// ROUTE 2: Add user profile details using: POST "api/profile/createprofile" - Login Required
router.post(
  "/createprofile",
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
    try {
      // Check whether username is already taken
      let user = await Profile.findOne({ username: req.body.username });
      if (user) {
        return res
          .status(400)
          .json({ error: "username already in use, try another !" });
      }
      const { username, first_name, last_name } = req.body;

      //   If there are errors return bad request and the errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const profile = new Profile({
        username,
        first_name,
        last_name,
        user: req.user.id,
      });
      const userProfile = await profile.save();

      res.json(userProfile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error !");
    }
  }
);

// ROUTE 3: Update user profile details using: PUT "api/profile/updateprofile" - Login Required
router.put("/updateprofile/:id", fetchuser, async (req, res) => {
  try {
    const { first_name, last_name } = req.body;

    //Create New profile details object
    const newProfile = {};
    if (first_name) {
      newProfile.first_name = first_name;
    }
    if (last_name) {
      newProfile.last_name = last_name;
    }

    //Find the profile to be updated and check if it is the same user's profile
    let profile = await Profile.findById(req.params.id);
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
    console.error(error.message);
    res.status(500).send("Internal server error !");
  }
});

// ROUTE 4: Get all user profiles except own using: GET "api/profile/getallprofile" - Login Required
router.get("/getallprofile", fetchuser, async (req, res) => {
  try {
    const ownprofile = await Profile.find({ user: req.user.id });
    const profile = await Profile.find();
    const index = profile.indexOf(ownprofile);
    console.log(ownprofile);
    // profile.splice(index, 1);
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error !");
  }
});

module.exports = router;
