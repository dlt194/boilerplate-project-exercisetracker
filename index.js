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
  id: String,
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

app.post("/api/users", (req, res) => {
  username = req.body.username;
  newUser = new userModel({
    username: username,
  });

  newUser
    .save()
    .then((user) => {
      res.json({ username: user.username, _id: user._id });
    })
    .catch(function (err) {
      console.error(err);
      res.json({ error: err });
    });
});

app.post("/api/users/:id/exercises", (req, res) => {
  id = req.params.id;
  description = req.body.description;
  duration = req.body.duration;
  date = req.body.date;

  if (!date) {
    date = new Date().toDateString();
  }

  userModel
    .findById(id)
    .then((user) => {
      newExercise = new exerciseModel({
        id: user.id,
        username: user.username,
        description: description,
        duration: parseInt(duration),
        date: date,
      });

      newExercise
        .save()
        .then((exercise) => {
          res.json({
            username: user.username,
            description: exercise.description,
            duration: exercise.duration,
            date: new Date(exercise.date).toDateString(),
            _id: user._id,
          });
        })
        .catch(function (err) {
          console.error(err);
          res.json({ error: err });
        });
    })
    .catch(function (err) {
      console.error(err);
      res.json({ error: err });
    });
});

app.get("/api/users/:_id/logs", async function (req, res) {
  id = req.params._id;
  from = req.query.from || new Date(0).toDateString();
  to = req.query.to || new Date(Date.now()).toDateString();
  limit = Number(req.query.limit) || 0;

  user = await userModel.findById(id).exec();

  //? Find the exercises
  let exercises = await exerciseModel
    .find({
      id: id,
      date: { $gte: from, $lte: to },
    })
    .select("description duration date")
    .limit(limit)
    .exec();

  let parsedDatesLog = exercises.map((exercise) => {
    return {
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString(),
    };
  });

  res.json({
    _id: user._id,
    username: user.username,
    count: parsedDatesLog.length,
    log: parsedDatesLog,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
