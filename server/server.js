const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const fs = require("fs");
require("dotenv").config();
const Url = require("./models/Urls");
const app = express();

const bcryptSalt = bcrypt.genSaltSync(8);
const jwtSecret = "asdfe2fsdf8dafdf7dfsdf23q4v5aw";

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    credentials: true,
    origin: process.env.BASE_URL,
  })
);

mongoose.connect(process.env.MONGO_URL);

app.get("/test", (req, res) => {
  res.json("test oo [p]k");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });

    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });
  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jwt.sign(
        {
          email: userDoc.email,
          id: userDoc._id,
        },
        jwtSecret,
        {},
        (err, token) => {
          if (err) throw err;
          res.cookie("token", token).json(userDoc);
        }
      );
    } else {
      res.status(422).json("pass not ok");
    }
  } else {
    res.json("not found");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const { name, email, _id } = await User.findById(userData.id);
      res.json({ name, email, _id });
    });
  } else {
    res.json(null);
  }
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json(true);
});

app.post("/shorten", async (req, res) => {
  const { token } = req.cookies;
  const { fullUrl } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const urlDoc = await Url.create({
      user: userData.id,
      fullUrl,
    });
    res.json(urlDoc);
  });
});

app.put("/shorten", async (req, res) => {
  const { token } = req.cookies;
  const { id, fullUrl } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const urlDoc = await Url.findById(id);
    urlDoc.set({ fullUrl });
    await urlDoc.save();
    res.json(urlDoc);
  });
});

app.get("/user-urls", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const { id } = userData;
    res.json(await Url.find({ user: id }));
  });
});

app.get("/url/:id", async (req, res) => {
  const { id } = req.params;
  res.json(await Url.findById(id));
});

app.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Url.findOneAndDelete({ shortUrl: id });
    res.json(deleted);
  } catch (error) {
    res.status(500).send("No data found.");
  }
});

app.get("/allUrls", async (req, res) => {
  try {
    const urls = await Url.find();
    res.json(urls);
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});

app.get("/:shortUrl", async (req, res) => {
  try {
    const shortUrl = req.params.shortUrl;
    const url = await Url.findOne({ shortUrl });
    if (!url) {
      return res.status(400).send("URL not found");
    }
    // Increment the click count and save the updated URL
    url.clicks++;
    url.save();
    res.redirect(url.fullUrl);
  } catch (error) {
    res.status(500).send("URL not found");
  }
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port);
