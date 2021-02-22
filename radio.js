#!/usr/bin/env node

const Throttle = require("throttle");
const ffprobe = require("node-ffprobe");
const http = require("http");
const fs = require("fs");
var sink = new Map();
var port = process.argv.slice(2)[0]||4600;
var dirname = process.argv.slice(3)[0]||process.cwd();
var stream;var np;var readable;var logs = [];var songnum = 0;

process.title = "OpenRadio";

const server = http.createServer((req, res) => {
	// if There's no stream, Do nothing and act nothing.
        if (!stream) play();
        var m = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	var generateId = () => m[Math.floor(Math.random() * m.length)];
	var id = generateId()+generateId()+generateId()+generateId()+generateId()+generateId();
	res.setHeader('Content-Type', "audio/mpeg");
	logs.push(`[${Date()}] New Sink Connected (${id})`);
	sink.set(id, res);
	req.on("close", () => {
		logs.push(`[${Date()}] Sink (${id}) Disconnected.`);
		sink.delete(id);
	});
}).listen(port, () => {
	console.log("---> Radio started at port:", port);
	console.log("---> Send request to http://127.0.0.1:"+port+" to Start radio");
	console.log("---> Or type command to manage audio");
	console.log("---> Or Press Enter to Play the radio stadion in Background.");
	console.log("\nFor command list, Type `.help`");
	process.stdout.write("Command > ");
});


const Fs = require('fs');
const { extname } = require('path');

const _readDir = () => Fs.readdirSync(dirname, { withFileTypes: true });

const _isMp3 = item => item.isFile && extname(item.name) === '.mp3';

var manager = {}

manager.readSong = () => _readDir().filter(_isMp3)[0].name;
manager.readSongs = () => _readDir().filter(_isMp3).map((songItem) => songItem.name);

manager.discardFirstWord = str => str.substring(str.indexOf(' ') + 1);
manager.getFirstWord = str => str.split(' ')[0];

console.log("Total Songs in Directory:", manager.readSongs().length);

async function play(n) {
	var song = manager.readSongs()
		var filename = song[new Number(n)-1]||song[songnum++];
		if (n) songnum = n;
		if (!filename) {
			filename = song[0];
			songnum = 1;
		}
		ffprobe(filename).then(async ({ format }) => {
			var bps = format.bit_rate / 8;

			stream = new Throttle(bps);
			stream.on("data", (chunk) => {
				sink.forEach((s) => {
					s.write(chunk);
				});
			});

			stream.on("end", () => {
				if (!stream) return;
				if (!stream.stopped) return play();
			});
			// Convert music files
			var readable = fs.createReadStream(dirname+"/"+filename);
			fs.createReadStream(dirname+"/"+filename).pipe(stream);
		try {
			process.stdout.cursorTo(0);
			process.stdout.clearLine(0);
		} catch (error) {}
			console.log("--> Now Playing:", `[${songnum}] ${filename}`);
			np = filename;
			process.stdout.write("Command > ");
		}).catch(e => {
		try {
                        process.stdout.cursorTo(0);
                        process.stdout.clearLine(0);
                } catch (error) {}
			logs.push(e);
			console.log("--> Seems like we got some error with one of your file. Skipping...");
			songnum++;
			play();
		});
}

process.stdin.on("data", (data) => {
	var str = data.toString().trim();
	if (!stream) {
		if (!str.startsWith(".")) play();
	}
	console.log("");
	if (str.startsWith(".")) {
		var command = str.slice(1).split(" ")[0];
		if (command === "help") {
			console.log(".skip -", "Skip & Play other song");
			console.log(".np -", "Showing Current playing song name");
			console.log(".q / .ls -", "Showing song name in current folder");
			console.log(".p -", "Skip & play provided song number");
			console.log(".stop -", "Stop the player");
			console.log(".logs -", "Show HTTP Traffic Logs");
			console.log(".clearlogs -", "Clear logs");
			console.log(".sink -", "Show all Sink name");
		} else if  (command === "skip") {
			if (!stream) return console.log("Nothing Playing.");
			stream.end();
			return console.log("->> Skipping "+"["+songnum+"] "+np+"....");
		} else if (command === "np") {
			if (!np) return console.log("Nothing Playing.");
			console.log("############### Now Playing ###############\n");
			console.log(`[${songnum}]`, np);
		} else if (command === "q"||command === "ls") {
			console.log("############### Song List ###############\n");
			var cl = 1;
			manager.readSongs().forEach(e => {
				console.log(`[${cl}]`, e);
				cl++;
			});
			if (np) {
				console.log("");
				console.log("############### Now Playing ###############\n");
				console.log(`[${songnum}]`, np);
			}
		} else if (command === "p"|| command === "play") {
			let songnumber = new Number(str.split(" ")[1]);
			if (!songnumber) {
				console.log("Usage: .p [Song number]");
				console.log("To get song number, Do `.q`\n");
				return process.stdout.write("Command > ");
			}
			var sname = manager.readSongs()[songnumber-1];
			if (!sname) {
				console.log("Song not found\n");
				return process.stdout.write("Command > ");
			}
			if (!stream) return play(songnumber);
			stream.stopped = true;
			stream.end(() => play(songnumber));
			return;
		} else if (command === "stop") {
			stream.stopped = true;
			np = null;
			stream.end();
		} else if (command === "logs") {
			console.log(logs.join("\n"));
		} else if (command === "clearlogs") {
			logs = [];
		} else if (command === "sink") {
			a = 1;var args = str.split(" ").slice(1).join(' ');
			if (!args) {
				console.log("--------------------- Sink Manager -");
				console.log("--- ID -----------------------------");
				sink.forEach((res, name) => {
					console.log(`${a}. ${name}`);
					a++
				});
				console.log("------------------------------------\nTotal Sink:", sink.size);
				console.log("To remove sink ID, Execute `.sink remove <sink id>`");
			} else {
				if (args.startsWith("remove")) {
					var id = args.split(" ").slice(1).join(" ");
					if (!id) {
						console.log("Usage: .sink remove <sink id>");
					} else {
						var res = sink.get(id);
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
		}
	}
	console.log("");
	process.stdout.write("Command > ");
});

module.exports = "We are not ready for used as Module. Please use the CLI version or use openradio with exec.";
