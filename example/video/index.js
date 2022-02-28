const openradio = require("openradio");
// As a regular TS does not works well in Browser,
// Stream it with specific media player, Like mpv or vlc.

const radio = openradio.video();
const http = require("http");
const fs = require("fs");

http
  .createServer((req, res) => {
    res.setHeader("content-type", "video/ts");
    radio.pipe(res);
  })
  .listen(3000);

var { extname } = require("path");
var list = fs
  .readdirSync("./Video", { withFileTypes: true })
  .filter(function (item) {
    // Make it returns true
    return (
      item.isFile &&
      (extname(item.name) === ".mp4" ||
        extname(item.name) === ".mkv" ||
        extname(item.name) === ".webm" ||
        extname(item.name) === ".3gp" ||
        extname(item.name) === ".ogv")
    );
  })
  .map((videoItem) => videoItem.name);

// Fetch & Play song randomly fron Video Directory!
radio.play(`./Video/${list[Math.floor(Math.random() * list.length)]}`);
radio.on("finish", () => {
  radio.play(`./Video/${list[Math.floor(Math.random() * list.length)]}`);
});
