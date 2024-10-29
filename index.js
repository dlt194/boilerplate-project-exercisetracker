const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const exerciseSchema = new mongoose.Schema({
  userId: String,
  username: String,
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String,
});

const userSchema = new mongoose.Schema({
  username: String,
});

let User = mongoose.model("User", userSchema);
let Exercise = mongoose.model("Exercise", exerciseSchema);

app.get("/", async (_req, res) => {
  res.sendFile(__dirname + "/views/index.html");
  await User.syncIndexes();
  await Exercise.syncIndexes();
});

app.get("/api/users", function (_req, res) {
  User.find({})
    .then((users) => {
      res.json(users);
    })
    .catch((err) => {
      console.error(err);
      res.json({ error: err });
    });
});

app.post("/api/users", function (req, res) {
  const username = req.body.username;

  let newUser = new User({ username: username });

  newUser
    .save()
    .then((user) => {
      res.json({ username: user.username, _id: user._id });
    })
    .catch((err) => {
      console.error(err);
      res.json({ error: err });
    });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  var userId = req.params._id;
  var description = req.body.description;
  var duration = req.body.duration;
  var date = req.body.date;

  if (!date) {
    date = new Date().toISOString().substring(0, 10);
  }

  User.findById(userId)
    .then((userInDb) => {
      let newExercise = new Exercise({
        userId: userInDb._id,
        username: userInDb.username,
        description: description,
        duration: parseInt(duration),
        date: date,
      });

      newExercise
        .save()
        .then((exercise) => {
          res.json({
            username: userInDb.username,
            description: exercise.description,
            duration: exercise.duration,
            date: new Date(exercise.date).toDateString(),
            _id: userInDb._id,
          });
        })
        .catch((err) => {
          console.error(err);
          res.json({ error: err });
        });
    })
    .catch((err) => {
      console.error(err);
      res.json({ error: err });
    });
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  const from = req.query.from || new Date(0).toISOString().substring(0, 10);
  const to =
    req.query.to || new Date(Date.now()).toISOString().substring(0, 10);
  const limit = Number(req.query.limit) || 0;

  let user = await User.findById(userId).exec();

  let exercises = await Exercise.find({
    userId: userId,
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
