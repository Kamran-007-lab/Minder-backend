const connecTtoMongo = require("./db");
const express = require("express");
const dotenv = require("dotenv").config();

connecTtoMongo();

const app = express();
const port = process.env.PORT;

app.use(express.json());

//Available routes
app.use("/api/auth", require("./routes/auth")); // For all authentication related end points
app.use("/api/profile", require("./routes/profile")); // To create and modify user profile data

app.listen(port, () => {
  console.log(`Minder app is listening on port ${port}`);
});
