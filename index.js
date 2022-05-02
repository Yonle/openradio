// The Openradio Core
const { spawn } = require("child_process");
const { PassThrough } = require("stream");
const events = require("events");

function convert(opt = {}, url) {
  return spawn("ffmpeg", [
    "-re",
    "-analyzeduration",
    "0",
    "-loglevel",
    "0",
    "-i",
    url || "-",
    "-f",
    opt.format || "mp3",
    "-ar",
    opt.rate || "44100",
    "-ac",
    opt.channels || "2",
    "-ab",
    `${opt.bitrate || "192"}k`,
    "-map",
    "0:a",
    "-map_metadata",
    "-1",
    "pipe:1",
  ]);
}

function cvideo(opt = {}, url) {
  return spawn("ffmpeg", [
    "-re",
    "-analyzeduration",
    "0",
    "-loglevel",
    "0",
    "-i",
    url || "-",
    "-vf",
    "scale=" + opt.scale || "-1:720",
    "-f",
    opt.format || "mpegts",
    "-ar",
    opt.arate || "44100",
    "-ac",
    opt.achannels || "2",
    "-ab",
    `${opt.abitrate || "192"}k`,
    "-codec:a",
    opt.acodec || "aac",
    "pipe:1",
  ]);
}

function pcmconv(opt = {}, pcmopt, url) {
  return spawn("ffmpeg", [
    "-re",
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
    url || "-",
    "-f",
    opt.format || "mp3",
    "-ar",
    opt.rate || "44100",
    "-ac",
    opt.channels || "2",
    "-ab",
    `${opt.bitrate || "192"}k`,
    "-map",
    "0:a",
    "-map_metadata",
    "-1",
    "pipe:1",
  ]);
}

function OpenRadio_Core(opt) {
  let Core = new PassThrough();
  let converted = null;

  Core.header = null;
  Core.playing = false;
  Core.finish = false;
  Core.stream = null;

  // Player
  Core.play = function ReadStream(readable) {
    let newStream = 1;
    return new Promise((res, rej) => {
      if (Core.stream && "exitCode" in Core.stream && !Core.stream.exitCode)
        Core.stream.kill();
      Core.stream = convert(
        opt,
        typeof readable === "string" ? readable : null
      );

      Core.stream.stdout
        .on("data", (chunk) => {
          if (Core.header && newStream) return (newStream = 0);
          if (!Core.header && newStream) {
            Core.header = chunk;
            newStream = 0;
          }
          Core.write(chunk);
        })
        .on("end", (e) => {
          Core.emit("finish", e);
          Core.finish = true;
          Core.playing = false;
          return res(e);
        });
      Core.stream.on("error", (err) => {
        if (!Core.emit("error", err)) return rej(err);
      });

      if (typeof readable !== "string" && typeof readable.pipe === "function") {
        readable.on("error", (err) => Core.emit("error", err));
        readable.pipe(Core.stream.stdin);
      }
      Core.playing = true;
      Core.finish = false;
    });
  };

  // PCM Player
  Core.playPCM = function PCMPlayer(
    readable,
    options = { rate: 44100, channels: 2 }
  ) {
    let newStream = 1;
    return new Promise((res, rej) => {
      if (Core.stream && "exitCode" in Core.stream && !Core.stream.exitCode)
        Core.stream.kill();
      Core.stream = pcmconv(
        opt,
        options,
        typeof readable === "string" ? readable : null
      );
      Core.stream.stdout
        .on("data", (chunk) => {
          if (Core.header && newStream) return (newStream = 0);
          if (!Core.header && newStream) {
            Core.header = chunk;
            newStream = 0;
          }
          Core.write(chunk);
        })
        .on("end", (e) => {
          Core.emit("finish", e);
          Core.finish = true;
          Core.playing = false;
          return res(e);
        });
      Core.stream.on("error", (err) => {
        if (!Core.emit("error", err)) return rej(err);
      });

      if (typeof readable !== "string" && typeof readable.pipe === "function") {
        readable.on("error", (err) => Core.emit("error", err));
        readable.pipe(Core.stream.stdin);
      }
      Core.playing = true;
      Core.finish = true;
    });
  };

  return Core;
}

function OpenRadio_Video(opt) {
  let Core = new PassThrough();
  let converted = null;

  Core.header = null;
  Core.playing = false;
  Core.finish = false;
  Core.stream = null;

  // Player
  Core.play = function ReadStream(readable) {
    let newStream = 1;
    return new Promise((res, rej) => {
      if (Core.stream && "exitCode" in Core.stream && !Core.stream.exitCode)
        Core.stream.kill();
      Core.stream = cvideo(opt, typeof readable === "string" ? readable : null);
      Core.stream.stdout
        .on("data", (chunk) => {
          if (Core.header && newStream) return (newStream = 0);
          if (!Core.header && newStream) {
            Core.header = chunk;
            newStream = 0;
          }
          Core.write(chunk);
        })
        .on("end", (e) => {
          Core.emit("finish", e);
          Core.finish = true;
          Core.playing = false;
          return res(e);
        });
      Core.stream.on("error", (err) => {
        if (!Core.emit("error", err)) return rej(err);
      });
      if (typeof readable !== "string" && typeof readable.pipe === "function") {
        readable.on("error", (err) => Core.emit("error", err));
        readable.pipe(Core.stream.stdin);
      }
      Core.playing = true;
      Core.finish = false;
    });
  };

  return Core;
}

function repeater(radio) {
  // Clients
  let cs = new Set();
  radio.on("data", (d) =>
    cs.forEach((c) =>
      c.write(d, (e) => {
        if (e) cs.delete(c);
      })
    )
  );
  return (c) => {
    cs.add(c);
    return (_) => cs.delete(c);
  };
}

module.exports = OpenRadio_Core;
module.exports.video = OpenRadio_Video;
module.exports.repeater = repeater;
