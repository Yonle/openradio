//Openradio Core
const ffmpeg = require("prism-media").FFmpeg;
const Throttle = require("throttle");
const events = require("events");

function convert(opt) {
    if (!opt) {
		opt = {};
    }
    return new ffmpeg({
		args: ["-analyzeduration", "0", "-loglevel", "0", "-f", opt.format || "mp3", "-ar", opt.rate || "48000", "-ac", opt.channels || "2", "-ab", `${opt.bitrate || "96"}k`, "-map", "0:a", "-map_metadata", "-1"]
    });
}

function OpenRadio_Core(opt) {
    var Core = new events();
    var stream = null;
    var converted = null;

    Core.sink = new Map();
    Core.sink.deleteAll = function deleteAll() {
        Core.sink.forEach((s, id) => {
            Core.sink.delete(id);
        });
    };

    Core.playing = false;
    Core.ended = false;
    Core.end = null;
	Core.stream = null;
	
    // Player
    Core.play = async function ReadStream(readable, BytePerSecond) {
        if (BytePerSecond) {
            return new Error("BytePerSecond is Deprecated.");
        }

        stream = readable.pipe(convert(opt)).on('error', e => Core.emit('error', e)).pipe(Throttle(((() => { if (opt && opt.bitrate) return opt.bitrate * 1000 })() || 96000
        ) / 8));
        
        stream.on("data", (chunk) => {
            Core.emit("data", chunk);
            Core.sink.forEach((dest, id) => {
                try {
                    dest.write(chunk, (error) => {
                        if (error) {
                            return Core.sink.delete(id);
                        }
                    });
                } catch (error) {
                    Core.sink.delete(id);
                }
            });
        });

        stream.on("end", () => {
            Core.emit("end", null);
            Core.ended = true;
            Core.playing = false;
            Core.end = null;
        });
        stream.on("error", (err) => Core.emit("error", err));
        readable.on("error", (err) => Core.emit("error", err));
        Core.playing = true;
        Core.ended = false;
        Core.stream = stream;
		
        return stream;
    };

    Core.pipe = function (dest) {
        var id = Math.random().toString(36).slice(2);
        Core.sink.set(id, dest);
        dest.on('unpipe', () => {
        	Core.sink.delete(id);
        });
        dest.on('error', (e) => {
        	Core.sink.delete(id);
        	Core.emit('error', e);
        });
        dest.on('close', () => Core.sink.delete(id));
        dest.on('end', () => Core.sink.delete(id));
        dest.on('finish', () => Core.sink.delete(id));
        return id;
    };

    return Core;
}

module.exports = OpenRadio_Core;
