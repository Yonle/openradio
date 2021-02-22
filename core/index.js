// Openradio Core
const sink = new Map();
const ffprobe = require("node-ffprobe");
const events = require("events");
const CoreEvent = new events();
var stream = null;var bps;

CoreEvent.write = function (chunk) {
	CoreEvent.emit('data', chunk);
}

sink.deleteAll = function deleteAll () {
	sink.forEach((s, id) => {
		sink.delete(id);
	});
}

Core.playing = false;
Core.ended = false;

// Player
async function Core(readable, bps) {
        return Promise((res, rej) => {
			if (!bps) {
				ffprobe({ source: readable }).then(({ format }) => {
					bps = format.bit_rate / 8;
				}).catch(() => bps = 128000 / 8);
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
						sink.remove(id);
					}
                                });
                        });

                        stream.on("end", () => {
                                CoreEvent.emit("end", null);
				Core.ended = true;
				Core.playing = false;
                        });

                        if (!readable||!readable.pipe) return rej(`Not readable stream`);
                        readable.pipe(stream);
			Core.playing = true;
			Core.ended = false;
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
}

Core.on = CoreEvent.on;

Core.end = function End () {
	return Promise ((res, rej) => {
		if (stream) {
			stream.end(res);
			return true;
		} else {
			rej("Radio isn't started");
			return false;
		}
	});
}

Core.sink = sink;

Core.write = function WriteStream (chunk, callback) {
	if (!stream) return null;
	stream.write(chunk, callback);
}

Core.play = Core;

module.exports = Core;
