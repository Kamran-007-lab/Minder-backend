const express = require("express");
const router = express.Router();
const fetchuser = require("../middleware/fetchuser");
const { body, validationResult } = require("express-validator");
const Profile = require("../models/Profile");
const cloudinary = require("../utils/cloudinary");

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
    let success = false;
    try {
      // Check whether username is already taken
      let user = await Profile.findOne({ username: req.body.username });
      if (user) {
        console.log(req.file);
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

      const file = req.files.profileImg;
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: req.body.username,
      });

      const profile = new Profile({
        username: req.body.username,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        gender: req.body.gender,
        dating_prefrence: req.body.dating_prefrence,
        bio: req.body.bio,
        date_of_birth: req.body.date_of_birth,
        image: [result.url],
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
  let success = false;
  try {
    const {
      username,
      first_name,
      last_name,
      gender,
      dating_prefrence,
      bio,
      date_of_birth,
    } = req.body;

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
    if (gender) {
      newProfile.gender = gender;
    }
    if (dating_prefrence) {
      newProfile.dating_prefrence = dating_prefrence;
    }
    if (bio) {
      newProfile.bio = bio;
    }
    if (date_of_birth) {
      newProfile.date_of_birth = date_of_birth;
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
    success = true;
    res.json({ success, profile });
  } catch (error) {
    success = false;
    res.status(500).send({ success, error: "Internal server error !" });
  }
});

// ROUTE 4: Get all user profiles except own and remove those who have already been swiped using: GET "api/profile/getallprofile" - Login Required
router.get("/getallprofile", fetchuser, async (req, res) => {
  let success = false;
  try {
    const ownprofile = await Profile.findOne({ user: req.user.id });
    const profiles = await Profile.find();
    const index = profiles.findIndex(
      (profile) => profile.username === ownprofile.username
    );
    // console.log(index);
    if (index !== -1) {
      profiles.splice(index, 1);
    }

    // Get the usernames present in the matches map
    const matchedUsernames = Array.from(ownprofile.matches.keys());

    // Filter out profiles that have usernames in the matchedUsernames array
    const filteredProfiles = profiles.filter(
      (profile) => !matchedUsernames.includes(profile.username)
    );

    success = true;
    res.json({ success, profiles: filteredProfiles });
  } catch (error) {
    success = false;
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

// ROUTE 6: Upload more photos to gallery using: PUT "api/profile/uploadphotos" - Login Required
router.put("/uploadphotos/:id", fetchuser, async (req, res) => {
  let success = false;

  //Find the profile to be updated and check if it is the same user's profile
  let profile = await Profile.findByIdAndUpdate(req.params.id);
  if (!profile) {
    return res.status(404).send("Not found");
  }

  if (profile.user.toString() !== req.user.id) {
    return res.status(401).send("Not allowed");
  }

  let username = profile.username;

  try {
    const files = req.files
      ? Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images]
      : [];
    // Assuming 'images' is the field name for multiple file uploads
    const imageUrls = [];

    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: username,
      });
      imageUrls.push(result.url);
    }

    // Append the new image URLs to the existing array
    profile.image = profile.image.concat(imageUrls);

    profile = await profile.save(); // Save the updated profile
    success = true;
    res.json({ success, profile });
  } catch (error) {
    success = false;
    console.log(error);
    res.status(500).send({ success, error: "Internal server error !" });
  }
});

// ROUTE 7: Swipe a user left or right and return if the current user has matched with the swiped user or not using: PUT "api/profile/swipe" - Login Required
router.put("/swipe", fetchuser, async (req, res) => {
  let success = false;
  let profile = await Profile.findOne({ user: req.user.id });
  if (!profile) {
    return res.status(404).send("Not found");
  }

  if (profile.user.toString() !== req.user.id) {
    return res.status(401).send("Not allowed");
  }

  try {
    const { userid, matchUsername, isMatched } = req.body;
    // Update the matches map
    profile.matches.set(matchUsername, isMatched);

    profile = await profile.save(); // Save the updated profile
    let otherprofile = await Profile.findById(userid);

    const hasMatch = otherprofile.matches.has(profile.username);

    success = true;
    if (hasMatch) {
      const matchValue = otherprofile.matches.get(profile.username);
      if (matchValue) {
        // Add the ID of the profile to otherprofile's mymatches array
        otherprofile.mymatches.push(profile._id);
        await otherprofile.save();
        // Add the ID of the otherprofile to profile's mymatches array
        profile.mymatches.push(otherprofile._id);
        await profile.save();
      }
      res.json({ success, matchValue, ownprofile: profile });
    } else {
      res.json({ success, matchValue: false, ownprofile: profile });
    }
  } catch (error) {
    success = false;
    console.error(error.message);
    res.status(500).send({ success, error: "Internal server error !" });
  }
});

// ROUTE 8: Get all user profiles except own: GET "api/profile/getalltheprofile" - Login Required
router.get("/getalltheprofile", fetchuser, async (req, res) => {
  let success = false;
  try {
    const ownprofile = await Profile.findOne({ user: req.user.id });
    const profiles = await Profile.find();
    const index = profiles.findIndex(
      (profile) => profile.username === ownprofile.username
    );
    // console.log(index);
    if (index !== -1) {
      profiles.splice(index, 1);
    }

    success = true;
    res.json({ success, profiles: profiles });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ success, error: "Internal server error !" });
  }
});

module.exports = router;
