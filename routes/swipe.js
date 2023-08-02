const express=require("express");
const router=express.Router();
const fetchuser=require("../middleware/fetchuser");

router.get("/swipe", fetchuser, async (req, res) => {
  try {
    const profile = await Profile.find({ user: req.user.id });
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error !");
  }
});