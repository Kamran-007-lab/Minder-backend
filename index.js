const connecTtoMongo = require("./db");
const express = require("express");
const dotenv = require('dotenv').config()

connecTtoMongo();

const app = express();
const port = process.env.PORT;

app.get("/", (req, res) => {
  try {
    res.send("Hello World!");
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
