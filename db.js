const mongoose = require('mongoose');
const dotenv = require('dotenv').config()
const mongoURI = process.env.MONGO_CONNECTION_STRING

connecTtoMongo().catch(err => console.log(err));

async function connecTtoMongo() {
  await mongoose.connect(mongoURI);
  console.log("Connected to mongo succesfully");
}

module.exports = connecTtoMongo;