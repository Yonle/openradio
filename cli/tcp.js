#!/usr/bin/env node

const Throttle = require("throttle");
const ffmpeg = require('prism-media').FFmpeg;
const compatibleFormat = require("./compatibleFormat.json");
const net = require("net");
const fs = require("fs");
let sink = new Map();
let port = process.argv.slice(2)[0] || 5000;
let dirname = process.argv.slice(3)[0] || process.cwd();
let stream;
let np;
let readable;
let logs = [];
let songnum = 0;
let loop = false;
let random = false;

process.title = "OpenRadio";
if (!dirname.endsWith("/")) dirname = dirname + "/";
const server = new net.Server((res) => {
        // if There's no stream, Do nothing and act nothing.
        if (!stream) play();
        let generateId = () => Math.random().toString(36).slice(2);
        let id = generateId() + generateId() + generateId() + generateId() + generateId() + generateId();
        logs.push(`[${Date()}] New Sink Connected (${id})`);
        sink.set(id, res);
        res.on("close", () => {
            logs.push(`[${Date()}] Sink (${id}) Disconnected.`);
            sink.delete(id);
        });
        res.on("error", err => {
        	logs.push(`[${Date()}] ${err}`);
        	logs.push(`[${Date()}] Sink (${id}) Disconnected.`);
        	sink.delete(id);
        });
    })
    .listen(port, () => {
        console.log("---> Radio started at port:", port);
        console.log("---> Send request to tcp://127.0.0.1:" + port + " to Start radio");
        console.log("---> Or type command to manage radio");
        console.log("---> Or Press Enter to Play the radio stadion in Background.");
        console.log("\nFor command list, Type `help`");
        process.stdout.write("Command > ");
    });

const Fs = require("fs");
const { extname } = require("path");

const _readDir = () => Fs.readdirSync(dirname, { withFileTypes: true });

const _isAudio = item => (item.isFile && compatibleFormat.includes(extname(item.name)));

let manager = {};

function convert() {
	return new ffmpeg({
		args: ["-analyzeduration", "0", "-loglevel", "0", "-f", "mp3", "-ar", "48000", "-ac", "2", "-ab", "192k", "-map", "0:a", "-map_metadata", "-1"],
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
    if (manager.readSongs().length === 0) {
        console.log("There's no songs in this directory. Please put one and try again!");
        return process.stdout.write("Command > ");
    }
    if (stream) {
    	if (stream.playing) return;
    }
    let filename = song[new Number(n) - 1] || song[songnum++];
    if (n) songnum = n;
    if (!filename) {
        filename = song[0];
        songnum = 1;
    }

    if (loop) {
        if (!n) {
            songnum = songnum - 1;
            filename = song[songnum - 1];
        }
    }
    if (random) {
        if (!n) {
            songnum = Math.floor(Math.random() * song.length);
            filename = song[songnum - 1];
        }
    }
        stream = fs.createReadStream(`${dirname}/${filename}`).pipe(convert()).pipe(Throttle(24000));
        stream.on("data", (chunk) => {
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

	stream.on('error', err => {
	    console.error(`An error occured when playing ${filename}:`, err);
	    console.log("Skipping....");
	    play();
	});

        console.log("\n--> Now Playing:", `[${songnum}] ${filename}`);
        np = filename;
        process.stdout.write("Command > ");
}

process.stdin.on("data", (data) => {
    let str = data.toString().trim();
    if (!stream) {
        play();
    }
    console.log("");
    if (str) {
        let command = str.split(" ")[0];
        if (command === "help") {
            console.log("skip -", "Skip & Play other song");
            console.log("np -", "Showing Current playing song name");
            console.log("q / ls -", "Showing song name in current folder");
            console.log("p -", "Skip & play provided song number");
            console.log("stop -", "Stop the player");
            console.log("logs -", "Show TCP Traffic Logs");
            console.log("clearlogs -", "Clear logs");
            console.log("sink -", "Show all Sink name");
            console.log("loop -", "Loop the current song");
            console.log("random -", "Enable Random song fetching");
            console.log("pause -", "Pause the radio");
            console.log("resume -", "Resume the radio");
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
            let songnumber = Number(str.split(" ")[1]);
            if (!songnumber) {
                console.log("Usage: p [Song number]");
                console.log("To get song number, Do `q`\n");
                return process.stdout.write("Command > ");
            }
            let sname = manager.readSongs()[songnumber - 1];
            if (!sname) {
                console.log("Song not found\n");
                return process.stdout.write("Command > ");
            }
            if (!stream) return play(songnumber);
            stream.playing = false;
            stream.stopped = true;
            stream.destroy();
            play(songnumber);
            return;
        } else if (command === "stop") {
        	if (!stream) return console.log('Nothing playing.');
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
                console.log("------------------------------------\nTotal Sink:", sink.size);
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
			if (!stream) return console.log('Nothing playing.');
			stream.pause();
		} else if (command === "resume") {
			if (!stream) return console.log('Nothing playing.');
			stream.resume();
		}
    }
    console.log("");
    process.stdout.write("Command > ");
});

module.exports = "We are not ready for used as Module. Please use the CLI version or use openradio with exec.";
