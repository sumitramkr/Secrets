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
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

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
userSchema.plugin(findOrCreate);

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
// used to serialize the user for the session
passport.serializeUser(function (user, done) {
  done(null, user.id);
  // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:4100/auth/google/secrets",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.get("/", function (req, res) {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  }
);

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

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    } else {
      req.session.destroy(function (err) {
        res.redirect("/");
      });
    }
  });
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
  // const username = req.body.username;
  // const password = req.body.password;

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

  const oldUser = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(oldUser, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(4100, function () {
  console.log("Connected on port 4100");
});
