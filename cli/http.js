#!/usr/bin/env node

const Throttle = require("throttle");
const ffmpeg = require("prism-media").FFmpeg;
const compatibleFormat = require("./compatibleFormat.json");
const http = require("http");
const readline = require("readline");
const rl = readline.createInterface(process.stdin, process.stdout);
const fs = require("fs");
let sink = new Map();
let port = process.argv.slice(2)[0] || 4600;
let dirname = process.argv.slice(3)[0] || process.cwd();
let stream;
let np;
let host;
let readable;
let header;
let logs = [];
let songnum = 0;
let loop = false;
let random = false;

process.title = "OpenRadio";
process.argv.forEach((e, index) => {
  if (e === "-a" || (e === "--address" && index < process.argv.length - 1)) {
    host = process.argv[index + 1];
  }
});
if (!dirname.endsWith("/")) dirname = dirname + "/";
const server = http
  .createServer((req, res) => {
    // if There's no stream, Do nothing and act nothing.
    if (!stream) play();
    let generateId = () => Math.random().toString(36).slice(2);
    let id =
      generateId() +
      generateId() +
      generateId() +
      generateId() +
      generateId() +
      generateId();
    res.setHeader("Content-Type", "audio/mpeg");
    logs.push(`[${Date()}] New Sink Connected (${id})`);
    if (header) res.write(header);
    sink.set(id, res);
    req.on("close", () => {
      logs.push(`[${Date()}] Sink (${id}) Disconnected.`);
      sink.delete(id);
    });
  })
  .listen(port, host || "0.0.0.0", () => {
    console.log("---> Radio started at port:", port);
    console.log(
      `---> Send request to http://${host || "0.0.0.0"}:${port} to Start radio`
    );
    console.log("---> Or type command to manage radio");
    console.log("---> Or Press Enter to Play the radio stadion in Background.");
    console.log("\nFor command list, Type `help`");
    rl.prompt();
  });

const Fs = require("fs");
const { extname } = require("path");

const _readDir = () => Fs.readdirSync(dirname, { withFileTypes: true });

const _isAudio = (item) =>
  item.isFile && compatibleFormat.includes(extname(item.name));

let manager = {};

function convert(filename) {
  return new ffmpeg({
    args: [
      "-i",
      filename,
      "-analyzeduration",
      "0",
      "-loglevel",
      "0",
      "-f",
      "mp3",
      "-ar",
      "48000",
      "-ac",
      "2",
      "-ab",
      "192k",
      "-map",
      "0:a",
      "-map_metadata",
      "-1",
    ],
  });
}

manager.readSong = () => _readDir().filter(_isAudio)[0].name;
manager.readSongs = () =>
  _readDir()
    .filter(_isAudio)
    .map((songItem) => songItem.name);

manager.discardFirstWord = (str) => str.substring(str.indexOf(" ") + 1);
manager.getFirstWord = (str) => str.split(" ")[0];

console.log("Total Songs in Directory:", manager.readSongs().length);

async function play(n) {
  let song = manager.readSongs();
  let newSong = 1;
  if (manager.readSongs().length === 0) {
    console.log(
      "There's no songs in this directory. Please put one and try again!"
    );
    return rl.prompt();
  }
  if (stream) {
    if (stream.playing) return;
  }
  let filename = song[new Number(n) - 1] || song[songnum++];
  if (n) songnum = n;

  if (loop) {
    if (!n) {
      if (songnum != 1) {
        songnum = songnum - 1;
        filename = song[songnum - 1];
      } else {
        songnum = manager.readSongs().length;
        filename = song[songnum - 1];
      }
    }
  }

  if (random) {
    if (!n) {
      songnum = Math.floor(Math.random() * song.length);
      filename = song[songnum - 1];
    }
  }

  if (!filename || !songnum) {
    filename = song[0];
    songnum = 1;
  }

  stream = convert(`${dirname}/${filename}`).pipe(Throttle(24000));
  stream.on("data", (chunk) => {
    if (header && newSong) return (newSong = 0);
    if (!header && newSong) {
      header = chunk;
      newSong = 0;
    }
    sink.forEach((s) => {
      s.write(chunk);
    });
  });
  stream.playing = true;
  stream.on("end", () => {
    if (!stream) return;
    if (stream.stopped) return;
    stream.playing = false;
    play();
  });

  stream.on("error", (err) => {
    console.error(`An error occured when playing ${filename}:`, err);
    console.log("Skipping....");
    play();
  });

  console.log("\n--> Now Playing:", `[${songnum}] ${filename}`);
  np = filename;
  rl.prompt();
}

rl.on("line", (str) => {
  if (str) {
    let command = (str.split(" ")[0] || "").toLowerCase();
    if (command === "help") {
      console.log("skip -", "Skip & Play other song");
      console.log("np -", "Showing Current playing song name");
      console.log("q / ls -", "Showing song name in current folder");
      console.log("p -", "Skip & play provided song number");
      console.log("stop -", "Stop the player");
      console.log("logs -", "Show HTTP Traffic Logs");
      console.log("clearlogs -", "Clear logs");
      console.log("sink -", "Show all Sink name");
      console.log("loop -", "Loop the current song");
      console.log("random -", "Enable Random song fetching");
      console.log("pause -", "Pause the radio");
      console.log("resume -", "Resume the radio");
      console.log("cd -", "Change directory");
      console.log(
        "\nTo listen to different Address, Do `openradio 3000 . -a 127.0.0.1`"
      );
    } else if (command === "skip") {
      if (!stream) return console.log("Nothing Playing.");
      stream.playing = false;
      stream.stopped = true;
      stream.destroy();
      return play();
    } else if (command === "np") {
      if (!np) return console.log("Nothing Playing.");
      console.log("############### Now Playing ###############\n");
      console.log(`[${songnum}]`, np);
    } else if (command === "q" || command === "ls") {
      console.log("############### Song List ###############\n");
      let cl = 1;
      manager.readSongs().forEach((e) => {
        console.log(`[${cl}]`, e);
        cl++;
      });
      if (np) {
        console.log("");
        console.log("############### Now Playing ###############\n");
        console.log(`[${songnum}]`, np);
      }
    } else if (command === "p" || command === "play") {
      let songnumber = Number(str.split(" ").slice(1)[0]);
      if (!songnumber) {
        console.log("Usage: p [Song number]");
        console.log("To get song number, Do `q`\n");
        return rl.prompt();
      }
      let sname = manager.readSongs()[songnumber - 1];
      if (!sname) {
        console.log("Song not found\n");
        return rl.prompt();
      }
      if (!stream) return play(songnumber);
      stream.playing = false;
      stream.stopped = true;
      stream.destroy();
      play(songnumber);
      return;
    } else if (command === "stop") {
      if (!stream) return console.log("Nothing playing.");
      stream.stopped = true;
      stream.playing = false;
      np = null;
      stream.end();
    } else if (command === "logs") {
      console.log(logs.join("\n"));
    } else if (command === "clearlogs") {
      logs = [];
    } else if (command === "sink") {
      a = 1;
      let args = str.split(" ").slice(1).join(" ");
      if (!args) {
        console.log("--------------------- Sink Manager -");
        console.log("--- ID -----------------------------");
        sink.forEach((res, name) => {
          console.log(`${a}. ${name}`);
          a++;
        });
        console.log(
          "------------------------------------\nTotal Sink:",
          sink.size
        );
        console.log("To remove sink ID, Execute `.sink remove <sink id>`");
      } else {
        if (args.startsWith("remove")) {
          let id = args.split(" ").slice(1).join(" ");
          if (!id) {
            console.log("Usage: .sink remove <sink id>");
          } else {
            let res = sink.get(id);
            if (!res) {
              console.log("There's no Sink ID", res);
            } else {
              res.end();
              sink.delete(id);
              console.log("--> Removed Sink", id);
              console.log("Total Sink:", sink.size);
            }
          }
        }
      }
    } else if (command === "loop") {
      if (random) random = false;
      if (!loop) {
        loop = true;
        console.log("Loop is now enabled.");
      } else {
        loop = false;
        console.log("Loop is now disabled");
      }
    } else if (command === "random") {
      if (loop) loop = false;
      if (!random) {
        random = true;
        console.log("Random mode is now enabled");
      } else {
        random = false;
        console.log("Random mode is now Disabled");
      }
    } else if (command === "pause") {
      if (!stream) return console.log("Nothing Playing.");
      stream.pause();
    } else if (command === "resume") {
      if (!stream) return console.log("Nothing Playing.");
      stream.resume();
    } else if (command === "cd") {
      let args = str.split(" ").slice(1).join(" ");
      try {
        process.chdir(args || process.env.HOME);
        dirname = process.cwd() + "/";
      } catch (error) {
        console.error(error);
      }
    }
  } else {
    if (!stream) play();
  }
  rl.prompt();
});

rl.setPrompt("Command > ");
