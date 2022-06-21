//jshint esversion:6
require("dotenv").config();
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const e = require("express");

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "Some string.",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// const saltRounds = 10;

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated) {
    res.render("secrets");
  } else {
    res.redirect("/login"); // as we want user to be authenticated to log in
  }
});

app.post("/register", function (req, res) {
  // bcrypt.hash(req.body.password, 10, function (err, hashedPassword) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     var newUser = new User({
  //       email: req.body.username,
  //       password: hashedPassword,
  //     });
  //     newUser.save(function (err) {
  //       if (!err) {
  //         res.render("secrets");
  //       } else {
  //         res.send("Try again");
  //       }
  //     });
  //   }
  // });

  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, newRegisteredUser) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const username = req.body.username;
  const password = req.body.password;

  // User.findOne({ email: username }, function (err, foundUser) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     if (foundUser) {
  //       bcrypt.compare(password, foundUser.password, function (err, result) {
  //         if (result === true) {
  //           res.render("secrets");
  //         } else {
  //           res.render("register");
  //         }
  //       });
  //     }
  //   }
  // });
});

app.listen(4100, function () {
  console.log("Connected on port 4100");
});
