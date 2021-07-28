#!/usr/bin/env node
const supportedPlatform = ["Linux"];
const { spawn } = require("child_process");
const openradio = require("../");
const http = require("http");
const server = http.createServer();
const argv = process.argv.slice(2);
const sink = new Map();
const config = {
	 input: {
	 	rate: 44100,
	 	channels: 2
	 },
	 output: {
	 	bitrate: 320,
	 	channels: 2,
	 	rate: 48000
	 },
	 server: {
	 	port: 8080,
	 	address: "0.0.0.0"
	 },
	 parec_path: process.env.PREFIX + "/bin/parec",
	 log: 0
}

if (!supportedPlatform.includes(require("os").type()) && !["--force", "-force", "-f"].includes(argv[0])) {
	console.log("Sorry. But we may stop here.");
	console.log(`\nYour platform (${require("os").type()}) is not supported to ran openradio-pulse. \nIf you wish to continue anyway, Simply do "openradio-pulse -f".`);
	process.exit(1);
}

console.log("\nOpenradio Pulseaudio - v1.0");

argv.forEach((key, index) => {
	let value = argv[index+1];
	if (["--port", "-port", "-p"].includes(key)) {
		if (isNaN(value)) return console.error("Usage: openradio-pulse --port [Port Number]");
		config.server.port = value;
	} else if (["-h", "-help", "--help"].includes(key)) {
		console.log("\nUsage: openradio-pulse [options]");
		console.log("\nCommon Options:\n");
		console.log(" --address [addr]          - IP Address to listen http server from.");
		console.log(" --port [num]              - Port to listen HTTP request (Default: 8080)");
		console.log(" --parec-path [Path]       - Path to parec binary (Default: $PREFIX/bin/parec)");
		console.log(" --help                    - Show this");
		console.log(" --log                     - Log every HTTP Traffic");
		console.log("\nAudio Input Options:\n");
		console.log(" --input-samplerate [num]  - Input Samplerate (Default: 44100)");
		console.log(" --input-channels [num]    - Input Channels (Default: 2)");
		console.log("\nAudio Output Options:\n");
		console.log(" --output-bitrate [num]    - Audio output Bitrate (Default: 320)");
		console.log(" --output-channels [num]   - Audio output channels (Default: 2)");
		console.log(" --output-samplerate [num] - Audio output samplerate (Default: 48000)");
		console.log("\nTo make this works perfectly, Make sure 'parec' binary is available in your system.");
		process.exit(0);
	} else if (["-prp", "-parec-path", "--parec-path"].includes(key)) {
		if (!value) return console.error("Usage: openradio-pulse --parec-path [parec binary path]");
		config.parec_path = value;
	} else if (["--input-samplerate", "-input-samplerate", ,"-ir"].includes(key)) {
		if (!value) return console.error("Usage: openradio-pulse --input-samplerate [num]");
		config.input.rate = value;
	} else if (["--input-channels", "-input-channels", "-ic"].includes(key)) {
		if (!value) return console.error("Usage: openradio-pulse --input-channels [num]");
		config.input.channels = value;
	} else if (["--output-bitrate", "-output-bitrate", "-ob"].includes(key)) {
		if (!value) return console.error("Usage: openradio-pulse --output-bitrate [num]");
		config.output.bitrate = value;
	} else if (["--output-channels", "-output-channels", "-oc"].includes(key)) {
		if (!value) return console.error("Usage: openradio-pulse --output-channels [num]");
		config.output.channels = value;
	} else if (["--output-samplerate", "-output-samplerate", "-or"].includes(key)) {
		if (!value) return console.error("Usage: openradio-pulse --output-samplerate [num]");
		config.output.rate = value;
	} else if (["--address", "-address", "-a"].includes(key)) {
		if (!value) return console.error("Usage: openradio-pulse --address [addr]");
		config.server.address = value;
	} else if (["--log", "-log", "-l", "-verbose", "--verbose", "-v"].includes(key)) {
		config.log = 1;
	}
});

server.on('error', console.error);
server.on('request', (req, res) => {
	let id = Math.random();
	let address = req.socket.address();
	sink.set(id, res);
	if (config.log) console.log(`[${Date()}]`, "New Client:", `${address.address}:${address.port}`);
	req.on('close', () => {
		sink.delete(id);
		if (config.log) console.log(`[${Date()}]`, "Client Disconnected:", `${address.address}:${address.port}`);
	});
});

console.log("For more information, do \"openradio-pulse -h\"\n");
console.log("Configuration:");
console.log("- Input");
console.log("  SampleRate:", config.input.rate);
console.log("  Channels  :", config.input.channels);
console.log("\n- Output");
console.log("  SampleRate:", config.output.rate);
console.log("  Channels  :", config.output.channels);
console.log("  Bitrate   :", config.output.bitrate);
console.log("\n- HTTP Server");
console.log("  Address   :", config.server.address);
console.log("  Port      :", config.server.port);
console.log("\nparec Binary path:", config.parec_path);
console.log("Log Incomming Traffic:", config.log ? "Yes" : "No");

process.stdout.write(`\n[${Date()}] Launching Server.... `);

let listener = server.listen(config.server.port, config.server.address, () => {
	process.stdout.write("Done");
	console.log(`\n[${Date()}]`, "Now listening on port", listener.address().port);

	let radio = openradio(config.output);
	radio.playPCM(spawn(config.parec_path, config.input).stdout);
	radio.on('data', chunk => {
		sink.forEach((res, id) => {
			res.write(chunk, err => {
				if (err) sink.delete(id);
			});
		});
	});
});

