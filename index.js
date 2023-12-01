const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { setDefaultHighWaterMark } = require("node:stream");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);
const fs = require("fs");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const PORT = 4000;

const oneDay = 1000 * 60 * 60 * 24;
const sessionMiddleware = session({
  secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
  saveUninitialized: true,
  cookie: { maxAge: oneDay },
  resave: false,
});

app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

// parsing the incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//serving public file
app.use(express.static(__dirname));

// cookie parser middleware
app.use(cookieParser());

//username and password
let passwords = {
  user1: "mypassword",
  user2: "password",
  admin: "totallyAdmin",
};

var loggedInUsers = {};

const loginPath = "./views/login.html";
const chatRoomPath = "./views/chatRoom.html";

app.get("/", (req, res) => {
  var session = req.session;
  if (session.userid) {
    res.redirect("/chatRoom");
  } else res.sendFile(loginPath, { root: __dirname });
});

app.get("/chatRoom", (req, res) => {
  var session = req.session;
  if (session.userid) {
    res.sendFile(chatRoomPath, { root: __dirname });
  } else res.redirect("/");
});

app.post("/user", (req, res) => {
  if (passwords[req.body.username] && req.body.password == passwords[req.body.username]) {
    var session = req.session;
    session.userid = req.body.username;
    session.connected = true;
    loggedInUsers[req.body.username] = true;
    console.log(req.session);
    res.redirect("/");
  } else {
    res.send("Invalid username or password");
  }
});

app.get("/logout", (req, res) => {
  loggedInUsers[req.session.userid] = null;
  req.session.destroy();
  res.redirect("/");
});

var messages = [];

io.on("connection", (socket) => {
  console.log("a user connected");
  const session = socket.request.session;

  socket.on("chat message", (msg) => {
    if (loggedInUsers[session.userid] === null) {
      socket.emit("redirect", "/");
    }

    let message = { username: session.userid, message: msg.message, time: Date.now() };
    messages.push(message);
    io.emit("chat message", message);
  });
  io.emit("updateEvent", messages);

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(PORT, () => {
  console.log("server running at http://localhost:" + String(PORT));
});

// const updateDelay = 5000;
// function sendUpdateEvent() {
//   io.emit("updateEvent", { time: Date.now() });
//   setTimeout(sendUpdateEvent, updateDelay);
// }
// setTimeout(sendUpdateEvent, updateDelay);
