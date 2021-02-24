// Openradio Core
const ffprobe = require("node-ffprobe");
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
	Core.play = async function ReadStream (readable, bps) {

        	return new Promise ((res, rej) => {
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
