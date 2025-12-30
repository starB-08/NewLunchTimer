const { createClient } = require("redis");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");
const http = require("http");
const db = createClient({
  username: "default",
  password: process.env.DB_PW,
  socket: {
    host: process.env.DB_URL,
    port: 15900,
  },
});
db.on("error", (err) => console.log("Redis Client Error", err));
(async () => {
  await db.connect();
  console.log("Redis connected");
})();

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;
const DB_URL = process.env.LUNCH_DB;

io.on("connection", (socket) => {
  // console.log("viewer connected:", socket.id);
  socket.emit("nowClass", classIndex);
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/frontend/viewer.html");
});

app.get("/viewer", (req, res) => {
  res.sendFile(__dirname + "/frontend/viewer.html");
});

app.get("/control", (req, res) => {
  res.sendFile(__dirname + "/frontend/control.html");
});

app.get("/control1", (req, res) => {
  res.sendFile(__dirname + "/frontend/control1.html");
});

app.get("/control2", (req, res) => {
  res.sendFile(__dirname + "/frontend/control2.html");
});

app.get("/control3", (req, res) => {
  res.sendFile(__dirname + "/frontend/control3.html");
});

app.get("/admin", (req, res) => {
  res.sendFile(__dirname + "/frontend/admin.html");
});

app.get("/nextClass/:i", (req, res) => {
  const i = Number(req.params.i);
  classIndex[i] += 1;
  if (classIndex[i] > maxClass[i]) classIndex[i] = 1;
  // console.log(classIndex);
  nowClass[i] = (firstClass[i] + classIndex[i] - 1) % maxClass[i];
  if (nowClass[i] == 0) nowClass[i] = maxClass[i];

  io.emit("nowClass", classIndex);
  io.emit("flicker", i);
  res.send(nowClass);
});

app.get("/prevClass/:i", (req, res) => {
  const i = Number(req.params.i);
  classIndex[i] -= 1;
  if (classIndex[i] <= 0) classIndex[i] = maxClass[i];
  // console.log(classIndex);
  nowClass[i] = (firstClass[i] + classIndex[i] - 1) % maxClass[i];
  if (nowClass[i] == 0) nowClass[i] = maxClass[i];

  io.emit("nowClass", classIndex);
  // io.emit("flicker", i);
  res.send(nowClass);
});

app.get("/getClass", (req, res) => {
  for (var i = 0; i < 3; i++) {
    nowClass[i] = (firstClass[i] + classIndex[i] - 1) % maxClass[i];
    if (nowClass[i] == 0) nowClass[i] = maxClass[i];
  }
  res.send(nowClass);
  console.log(nowClass);
});

app.get("/read", async (req, res) => {
  const result = await db.get("settings");

  const data = result ? JSON.parse(result) : null;
  _data = data;
  firstClass = _data.firstClass;
  maxClass = _data.classAmount;

  // console.log(`1: ${JSON.stringify(_data)} / ${firstClass} / ${maxClass}`);
  res.json(_data);
});

app.get("/write/:v", (req, res) => {
  const value = req.params.v;
  // console.log(value);

  const valueJson = JSON.parse(value);
  const amount = valueJson.classAmount;
  const first = valueJson.firstClass;
  classIndex = [1, 1, 1];
  firstClass = first;
  maxClass = amount;
  nowClass = first;

  const forParse = JSON.stringify({
    "classAmount": maxClass,
    "firstClass": firstClass,
  });
  _data = JSON.parse(forParse);

  console.log(`asdf: ${classIndex}`);
  io.emit("nowClass", nowClass);
  write_db(_data);
});

async function write_db(
  _data = `{
    classAmount: [10, 10, 10],
    firstClass: [1, 1, 1],
  };`
) {
  await db.set("settings", JSON.stringify(_data));
}

app.get("/getMaxClass", (req, res) => {
  res.json(JSON.parse(`{"max":[${maxClass}], "first":[${firstClass}]}`));
});

app.get("/playSound", (req, res) => {
  io.emit("playSound", 0);
  res.json("{'m':'DONE!'}");
});

app.get("/getIndex", (req, res) => {
  res.send(classIndex);
});

server.listen(port, () => {
  console.log(`server is listening at localhost:${port}`);
});

//----------------------------------------------------------//

let _data = JSON.parse("{}");
let nowClass = [1, 1, 1];
let classIndex = [1, 1, 1];
let firstClass = [1, 1, 1];
let maxClass = [10, 10, 13];
