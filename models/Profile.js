const mongoose = require("mongoose");
const { Schema } = mongoose;

const ProfileSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  dating_prefrence: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
  },
  date_of_birth: {
    type: Date,
    required: true,
  },
  image: [
    {
      type: String,
    },
  ],
  matches: {
    type: Map,
    of: Boolean,
    default: {},
  },
  mymatches: [
    {
      type: String,
    },
  ],
});

const Profile = mongoose.model("profile", ProfileSchema);
module.exports = Profile;
