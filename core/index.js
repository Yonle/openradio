//Openradio Core
const ffmpeg = require("prism-media").FFmpeg;
const { PassThrough } = require("stream");
const Throttle = require("throttle");
const events = require("events");

function convert(opt) {
    if (!opt) {
		opt = {};
    }
    return new ffmpeg({
		args: ["-analyzeduration", "0", "-loglevel", "0", "-f", opt.format || "mp3", "-ar", opt.rate || "44100", "-ac", opt.channels || "2", "-ab", `${opt.bitrate || "96"}k`, "-map", "0:a", "-map_metadata", "-1"]
    });
}

function OpenRadio_Core(opt) {
    let Core = new PassThrough();
    let converted = null;

    Core.playing = false;
    Core.finish = false;
	Core.stream = null;
	
    // Player
    Core.play = async function ReadStream(readable) {
    	return new Promise((res, rej) => {
			if (Core.stream && "destroyed" in Core.stream && !Core.stream.destroyed) Core.stream.destroy();
        	Core.stream = readable.pipe(convert(opt)).on('error', e => Core.emit('error', e)).pipe(Throttle(((() => { if (opt && opt.bitrate) return opt.bitrate * 1000 })() || 96000) / 8)).on("data", (chunk) => {
            	Core.write(chunk);
	        }).on("end", (e) => {
            	Core.emit("finish", e);
            	Core.finish = true;
            	Core.playing = false;
            	return res(e);
        	}).on("error", (err) => {
        		if (!Core.emit("error", err)) return rej(err);
        	});
        	readable.on("error", (err) => Core.emit("error", err));
    	    Core.playing = true;
	        Core.finish = false;
        });
    };

    return Core;
}

module.exports = OpenRadio_Core;
