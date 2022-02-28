const openradio = require("openradio");
const radio = openradio();
const http = require("http");
const fs = require("fs");

http
  .createServer((req, res) => {
    res.setHeader("content-type", "audio/mp3");
    if (radio.header) res.write(radio.header);
    radio.pipe(res);
  })
  .listen(3000);

var { extname } = require("path");
var list = fs
  .readdirSync("./Music", { withFileTypes: true })
  .filter(function (item) {
    // Make it returns true
    return (
      item.isFile &&
      (extname(item.name) === ".mp3" ||
        extname(item.name) === ".ogg" ||
        extname(item.name) === ".opus" ||
        extname(item.name) === ".aac" ||
        extname(item.name) === ".m4a" ||
        extname(item.name) === ".wav" ||
        extname(item.name) === ".flac" ||
        extname(item.name) === ".ape" ||
        extname(item.name) === ".wv" ||
        extname(item.name) === ".oga")
    );
  })
  .map((songItem) => songItem.name);

// Fetch & Play song randomly fron Music Directory!
radio.play(`./Music/${list[Math.floor(Math.random() * list.length)]}`);
radio.on("finish", () => {
  radio.play(`./Music/${list[Math.floor(Math.random() * list.length)]}`);
});
