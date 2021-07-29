#!/usr/bin/env node
const supportedPlatform = ["Linux"];
const { spawn } = require("child_process");
const { FFmpeg } = require("prism-media");
const fs = require("fs");
const http = require("http");
const server = http.createServer();
const argv = process.argv.slice(2);
const sink = new Map();
const config = {
  input: {
    rate: 44100,
    channels: 2,
  },
  output: {
    bitrate: 320,
    channels: 2,
    rate: 48000,
    format: "mp3",
  },
  server: {
    port: 8080,
    address: "0.0.0.0",
  },
  parec_path: process.env.PREFIX + "/bin/parec",
  log: 0,
  daemon: 1,
  force:
    argv.includes("-force") || argv.includes("--force") || argv.includes("-f"),
};

let header = null;
let warn = (text) => {
  console.warn(text);
  process.exit(1);
};

let error = (text) => {
  console.error(text);
  process.exit(1);
};

function pcmconv(opt = {}, pcmopt) {
  return new FFmpeg({
    args: [
      "-analyzeduration",
      "0",
      "-loglevel",
      "0",
      "-f",
      "s16le",
      "-ac",
      pcmopt.channels || 2,
      "-ar",
      pcmopt.rate || "44100",
      "-i",
      "-",
      "-f",
      opt.format || "mp3",
      "-ar",
      opt.rate || "48000",
      "-ac",
      opt.channels || "2",
      "-ab",
      `${opt.bitrate || "96"}k`,
      "-map",
      "0:a",
      "-map_metadata",
      "-1",
    ]
  });
}

if (config.force)
  console.warn("Warning: I'm sure you know what are you doing.");

if (!supportedPlatform.includes(require("os").type()) && !config.force) {
  console.log("Sorry. But we may stop here.");
  console.log(
    `\nYour platform (${require("os").type()}) is not supported to ran openradio-pulse. \nIf you wish to continue anyway, Simply do "openradio-pulse -f".`
  );
  process.exit(1);
}

console.log("\nOpenradio Pulseaudio - v1.3");

argv.forEach(async (key, index) => {
  let value = argv[index + 1];
  if (["--port", "-port", "-p"].includes(key)) {
    if (isNaN(value))
      return error("Usage: openradio-pulse --port [Port Number]");
    config.server.port = value;
  } else if (["-h", "-help", "--help"].includes(key)) {
    console.log("\nUsage: openradio-pulse [options]");
    console.log("\nCommon Options:\n");
    console.log(
      " --address [addr]          - IP Address to listen http server from."
    );
    console.log(
      " --port [num]              - Port to listen HTTP request (Default: 8080)"
    );
    console.log(
      " --parec-path [Path]       - Path to parec binary (Default: $PREFIX/bin/parec)"
    );
    console.log(" --help                    - Show this");
    console.log(" --log                     - Log every HTTP Traffic");
    console.log(" --force                   - Force any actions");
    console.log("\nDaemonize Service:\n");
    console.log(" --no-daemon               - Do not run as Daemonize Service");
    console.log(" --kill                    - Kill Daemonize service");
    console.log("\nAudio Input Options:\n");
    console.log(
      " --input-samplerate [num]  - Input Samplerate (Default: 44100)"
    );
    console.log(" --input-channels [num]    - Input Channels (Default: 2)");
    console.log("\nAudio Output Options:\n");
    console.log(
      " --output-bitrate [num]    - Audio output Bitrate (Default: 320)"
    );
    console.log(
      " --output-channels [num]   - Audio output channels (Default: 2)"
    );
    console.log(
      " --output-samplerate [num] - Audio output samplerate (Default: 48000)"
    );
    console.log(
      " --output-format [format]  - Audio output formats (Default: mp3)"
    );
    console.log(
      "\nTo make this works perfectly, Make sure 'parec' binary is available in your system."
    );
    process.exit(0);
  } else if (["-prp", "-parec-path", "--parec-path"].includes(key)) {
    if (!value)
      return error("Usage: openradio-pulse --parec-path [parec binary path]");
    config.parec_path = value;
  } else if (
    ["--input-samplerate", "-input-samplerate", , "-ir"].includes(key)
  ) {
    if (!value) return error("Usage: openradio-pulse --input-samplerate [num]");
    config.input.rate = value;
  } else if (["--input-channels", "-input-channels", "-ic"].includes(key)) {
    if (!value) return error("Usage: openradio-pulse --input-channels [num]");
    config.input.channels = value;
  } else if (["--output-bitrate", "-output-bitrate", "-ob"].includes(key)) {
    if (!value) return error("Usage: openradio-pulse --output-bitrate [num]");
    config.output.bitrate = value;
  } else if (["--output-channels", "-output-channels", "-oc"].includes(key)) {
    if (!value) return error("Usage: openradio-pulse --output-channels [num]");
    config.output.channels = value;
  } else if (
    ["--output-samplerate", "-output-samplerate", "-or"].includes(key)
  ) {
    if (!value)
      return error("Usage: openradio-pulse --output-samplerate [num]");
    config.output.rate = value;
  } else if (["--output-format", "-output-format", "-of"].includes(key)) {
    if (!value) return error("Usage: openradio-pulse --output-format [format]");
    if (["list", "help"].includes(value))
      return console.log(
        "Supported Formats List:",
        supportedFormats.join(", ")
      );
    config.output.format = value;
  } else if (["--address", "-address", "-a"].includes(key)) {
    if (!value) return error("Usage: openradio-pulse --address [addr]");
    config.server.address = value;
  } else if (
    ["--log", "-log", "-l", "-verbose", "--verbose", "-v"].includes(key)
  ) {
    config.log = 1;
  } else if (["--no-daemon", "-no-daemon", "-nd"].includes(key)) {
    config.daemon = 0;
  } else if (["--kill", "-kill", "-k"].includes(key)) {
    try {
      let daemons = JSON.parse(
        fs.readFileSync(process.env.TMPDIR + "/openradio-pulse-daemon.json")
      );
      console.log("Killing process " + daemons.pid + "....");
      try {
        process.kill(daemons.pid, "SIGKILL");
      } catch (error) {
        if (error.code === "ESRCH") {
          console.log("Daemon is already die. Removing temporary files....");
        } else error(error);
      }
      fs.rmSync(process.env.TMPDIR + "/openradio-pulse-daemon.json");
    } catch (error) {
      if (error.code === "ENOENT") {
        console.error(
          "There's no daemon was running or already killed.\nYou may should kill it manually by ran \"pkill -9 node\" if it's still running."
        );
        return process.exit(1);
      }
      console.error(error);
      return process.exit(1);
    }
    process.exit();
  }
});

server.on("error", (err) => console.error(`[${Date()}]`, err));
server.on("request", (req, res) => {
  let id = Math.random();
  let address = req.socket.address();
  res.writeHead(200, { "content-type": "audio/" + config.output.format });
  if (header) res.write(header);
  sink.set(id, res);
  if (config.log)
    console.log(
      `[${Date()}]`,
      "New Client:",
      `${address.address}:${address.port}`
    );
  req.on("close", () => {
    sink.delete(id);
    if (config.log)
      console.log(
        `[${Date()}]`,
        "Client Disconnected:",
        `${address.address}:${address.port}`
      );
  });
});

console.log('For more information, do "openradio-pulse -h"\n');

console.log("Configuration:");
console.log("- Input");
console.log("  SampleRate:", config.input.rate);
console.log("  Channels  :", config.input.channels);
console.log("\n- Output");
console.log("  SampleRate:", config.output.rate);
console.log("  Channels  :", config.output.channels);
console.log("  Bitrate   :", config.output.bitrate);
console.log("  Format    :", config.output.format);
console.log("\n- HTTP Server");
console.log("  Address   :", config.server.address);
console.log("  Port      :", config.server.port);
console.log("\nparec Binary path:", config.parec_path);
if (config.daemon) require("./daemon")();
console.log("Log Incomming Traffic:", config.log ? "Yes" : "No");

if (config.daemon && !process.env.__daemon) return;
process.stdout.write(`\n[${Date()}] Launching Server.... `);
let listener = server.listen(config.server.port, config.server.address, () => {
  process.stdout.write("Done");
  console.log(
    `\n[${Date()}]`,
    "Now listening on port",
    listener.address().port
  );

  function play() {
    let parec = spawn(config.parec_path, config.input);
    parec.on("close", play);
    parec.on("error", (err) => console.error(`[${Date()}]`, err));
    parec.stderr.pipe(process.stderr);
    parec.stdout.pipe(pcmconv(config.output, config.input)).on('error', err => console.error(`[${Date()}]`, err)).on('data', chunk => {
      if (!header) header = chunk;
      sink.forEach((res, id) => res.write(chunk, err => {
        if (err) sink.delete(id);
      }));
    });
  }

  play();
});