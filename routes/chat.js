const express = require("express");
const router = express.Router();
const chatModel = require("../models/chatModel");
const fetchuser = require("../middleware/fetchuser");
const Chat = require("../models/chatModel");
const Profile = require("../models/Profile");
const User = require("../models/User");

// ROUTE 1: Create new chat using: POST "api/chat/accesschat" - Login Required
router.post("/accesschat", fetchuser, async (req, res) => {
  let success = false;
  const { userid } = req.body;

  if (!userid) {
    res
      .status(400)
      .json({ success, error: "UserId param not sent with request !" });
  }

  let ischat = await chatModel
    .find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user.id } } },
        { users: { $elemMatch: { $eq: userid } } },
      ],
    })
    .populate("users", "-password -date -email -__v")
    .populate("latestMessage");

  ischat = await User.populate(ischat, {
    path: "latestMessage.sender",
    select: "",
  });

  if (ischat.length > 0) {
    success = true;

    const myprofile = await Profile.findOne({ user: req.user.id });
    const otherprofile = await Profile.findOne({ user: userid });
    res
      .status(200)
      .json({ success, ischat: ischat[0], myprofile, otherprofile });
  } else {
    let chatdata = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user.id, userid],
    };
    
    try {
      const myprofile = await Profile.findOne({ user: req.user.id });
      const otherprofile = await Profile.findOne({ user: userid });
      console.log(otherprofile)
      const createdChat = await Chat.create(chatdata);
      const Fullchat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password -date -email -__v"
      );
      success = true;
      res.status(200).json({ success, Fullchat, myprofile, otherprofile });
    } catch (error) {
      success = false;
      res.status(500).send({ success, error: "Internal server error !" });
    }
  }
});

// ROUTE 2: Fetch all chats using: GET "api/chat/fetchchats" - Login Required
router.get("/fetchchats", fetchuser, async (req, res) => {
  let success = false;
  try {
    success = true;
    let response = await Chat.find({
      users: { $elemMatch: { $eq: req.user.id } },
    })
      .populate("users", "-password -date -email -__v")
      .populate("groupAdmin", "-password -date -email -__v")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    response = await User.populate(response, {
      path: "latestMessage.sender",
      select: "",
    });

    response = Array.isArray(response) ? response : [response];

    let finalres = [];

    for (let i = 0; i < response.length; i++) {
      const myprofile = await Profile.findOne({ user: response[i].users[0] });
      const otherprofile = await Profile.findOne({
        user: response[i].users[1],
      });
      finalres.push({ response: response[i], myprofile, otherprofile });
    }
    res.status(200).send({ success, finalres });
  } catch (error) {
    success = false;
    res.status(500).send({ success, error: error });
  }
});

module.exports = router;
