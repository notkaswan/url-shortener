// Importing necessary libraries
const mongoose = require("mongoose");
const shortId = require("shortid");

// Defining a structure for the data we want to store in the database
const UrlsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fullUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
    default: shortId.generate,
  },
  clicks: {
    type: Number,
    required: true,
    default: 0,
  },
});

module.exports = mongoose.model("Urls", UrlsSchema);
