const express = require("express");
const session = require("express-session");
const router = express.Router();

router.get("/", function (req, res) {
  var session = req.session;
  if (session.userid) {
    res.sendFile("views/chatRoom.html", { root: process.cwd() });
  } else res.redirect("/");
});

router.get("/secret", function (req, res) {
  res.send("This is a secret page");
});

module.exports = router;
