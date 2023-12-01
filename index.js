const express = require("express");
const { createServer } = require("node:http");
const process = require("node:process");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);

const fs = require("fs");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const PORT = 4000;

const users = require("./users.json");

const oneDay = 1000 * 60 * 60 * 24;
const sessionMiddleware = session({
  secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
  saveUninitialized: true,
  cookie: { maxAge: oneDay },
  resave: false,
});

app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

const chatRoom = require("./routes/chatRoom.js");
app.use("/chatRoom", chatRoom);

// parsing the incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//serving public file
app.use(express.static(__dirname));

// cookie parser middleware
app.use(cookieParser());

const loginPath = "./views/login.html";
const chatRoomPath = "./views/chatRoom.html";

app.get("/", (req, res) => {
  var session = req.session;
  if (session.userid) {
    res.redirect("/chatRoom");
  } else res.sendFile(loginPath, { root: __dirname });
});

// app.get("/chatRoom", (req, res) => {
// });

app.post("/user", (req, res) => {
  let user = users[req.body.username];
  if (user === undefined) {
    res.send("Invalid username or password");
    return;
  }

  if (user.password == req.body.password) {
    var session = req.session;
    session.userid = req.body.username;
    res.redirect("/");
  } else {
    res.send("Invalid username or password");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

var messages = [];

io.on("connection", (socket) => {
  console.log("a user connected");
  const session = socket.request.session;

  socket.on("chat message", (msg) => {
    if (session.userid === undefined) return;
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

function loadSave(path) {
  fs.readFile(path, (err, data) => {
    if (err) throw err;

    messages = JSON.parse(data);

    console.log(messages);
  });
}

// loadSave(`${__dirname}/chatRoomSaves/chatSave-Fri Dec 01 2023.json`);

var messageSaveDir = `/chatRoomSaves`;
function saveMessagesToJson(path) {
  if (path === null) throw "save path needed";
  var fileName = `/chatSave-${new Date(Date.now()).toDateString()}.json`;

  fs.writeFile(`${__dirname}${path}${fileName}`, JSON.stringify(messages), (err) => {
    if (err) throw err;
    console.log("saves chat");
  });
}
