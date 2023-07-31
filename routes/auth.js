const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { body, validationResult } = require("express-validator");

// ROUTE 1: To create a user using: POST "api/auth/CreateUser" - No Login Required
router.post(
  "/CreateUser",
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
    body("email", "Enter Valid email").isEmail(),
    body(
      "password",
      "Password must be minimum length 8 with atleast 1 uppercase,1 lower case,1 number and a special character"
    ).isStrongPassword({
      minLength: 8,
      minUppercase: 1,
      minLowercase: 1,
      minNumbers: 1,
    }),
  ],
  async (req, res) => {
    //   If there are errors return bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check whether the user with the same email exists already
    let user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).json({ error: "You have already registered with this email!" });
    }

    // Check whether the user with the same email exists already
    user = await User.findOne({ usernme: req.body.username });
    if (user) {
      return res.status(400).json({ error: "Sorry username already in use!" });
    }
    user = await User.create({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    });

    //   .then((user) => res.json(user))
    //   .catch((err) => {
    //     res.json({
    //       error: "Some error encountered, find the error message below :",
    //       message: err.message,
    //     });
    //   });
  }
);

module.exports = router;
