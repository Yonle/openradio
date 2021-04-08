const openradio = require("openradio");
const radio = openradio();
const http = require("http");
const fs = require("fs");

http.createServer((req, res) => {
  res.setHeader("content-type", "audio/mp3");
  radio.pipe(res);
}).listen(3000);

  radio.play(fs.createReadStream("./Music/demo.mp3"));
  radio.on("end", () => {
    radio.play(fs.createReadStream("./Music/demo.mp3"));
  });
