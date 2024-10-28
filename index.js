const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
let bodyParser = require("body-parser");

let mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Schema = mongoose.Schema;

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String,
});

const userSchema = new Schema({
  username: String,
});

const exerciseModel = mongoose.model("exercise", exerciseSchema);
const userModel = mongoose.model("user", userSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", (req, res) => {
  userModel
    .find({})
    .then(function (users) {
      res.json(users);
    })
    .catch(function (err) {
      console.error(err);
      res.json({ error: err });
    });
});

app.post("/api/users/", (req, res) => {
  username = req.body.username;
  newUser = new userModel({
    username: username,
  });

  newUser
    .save((user) => {
      res.json({ username: user.username, _id: user._id });
    })
    .catch(function (err) {
      console.error(err);
      res.json({ error: err });
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
