// Openradio Core
const ffprobe = require("fluent-ffmpeg").ffprobe;
const Throttle = require("throttle");
const events = require("events");

function OpenRadio_Core () {

        const CoreEvent = new events();
        const sink = new Map();
        var stream = null;var bps;var Core = {};

        CoreEvent.write = function WriteBuffer (chunk) {
                CoreEvent.emit('data', chunk);
        }

        sink.deleteAll = function deleteAll () {
                sink.forEach((s, id) => {
                        sink.delete(id);
                });
        }

        Core.playing = false;
        Core.ended = false;
        Core.end = null;

        // Player
        Core.play = async function ReadStream (readable, BytePerSecond) {
                var bps = BytePerSecond;
                return new Promise ((res, rej) => {
                                if (!bps) {
                                        ffprobe(readable, async (err, data) => {
                                                if (err) {
                                                        bps = 128000 / 8;
                                                } else {
                                                        var bitrate = data.format.bit_rate;
                                                        if (!bitrate) {
                                                                if (data.streams.length === 0) {
                                                                        bitrate = data.format.bit_rate;
                                                                } else if (!data.format) {
                                                                        bitrate = data.streams[0].bit_rate
                                                                } else {
                                                                        bitrate = 128000;
                                                                }
                                                        }
                                                        bps = bitrate / 8;
                                                }
                                        })
                                }
                                stream = new Throttle(bps);
                                stream.on("data", (chunk) => {
                                        CoreEvent.write(chunk);
                                        sink.forEach((s, id) => {
                                                try {
                                                        s.write(chunk, (error) => {
                                                                if (error) {
                                                                        logs.push(`[${Date}] ${e}`);
                                                                        return sink.delete(id);
                                                                }
                                                        });
                                                } catch (error) {
                                                        sink.delete(id);
                                                }
                                        });
                                });

                                stream.on("end", () => {
                                        CoreEvent.emit("end", null);
                                        Core.ended = true;
                                        Core.playing = false;
                                        Core.end = null;
                                });

                                if (!readable||!readable.pipe) return rej(`Not readable stream`);
                                readable.pipe(stream);
                                Core.playing = true;
                                Core.ended = false;
                                Core.end = stream.end;
                                return res(stream);
                });
        }

        Core.pipe = function Player (writable) {
                var id = Math.random().toString(36).slice(2);
                if (!writable||!writable.write||typeof(writable) !== "WriteStream") {
                        throw new TypeError("Not a writable stream");
                        return false;
                }
                sink.set(id, sink);
                return id;
        }

        Core.on = CoreEvent.on;

        Core.sink = sink;

        return Core;
}

module.exports = OpenRadio_Core;
