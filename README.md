# Table of Content
- [OpenRadio CLI](#cli)
  - [Usage](#usage)
  - [Options](#options)
- [`core`](#core)
  - [`player.play`](#playerplay)
  - [`player.playPCM`](#playerplaypcm)
  - [`player.stream`](#playerstream)
  - [`player.header`](#playerheader)
  - [`player.on`](#playeron)
  - [`player.finished`](#playerfinished)
  - [`player.playing`](#playerplaying)
- [Example](#example)

# OpenRadio CLI
## CLI
Some openradio CLI that installed with `npm install -g openradio`
### Usage
```bash
openradio [Options]
```

## Options
Common Options:

```
 --address [addr]          - IP Address to listen http server from.
 --port [num]              - Port to listen HTTP request (Default: 8080)
 --parec-path [Path]       - Path to parec binary (Default: $PREFIX/bin/parec)
 --content-type [type]     - Custom content-type header to set in server response
 --help                    - Show this
 --log                     - Log every HTTP Traffic
 --force                   - Force any actions
```

Daemonize Service:

```
 --no-daemon               - Do not run as Daemonize Service
 --kill                    - Kill Daemonize service
```

Audio Input Options:

```
 --input-samplerate [num]  - Input Samplerate (Default: 44100)
 --input-channels [num]    - Input Channels (Default: 2)
```

Audio Output Options:

```
 --output-bitrate [num]    - Audio output Bitrate (Default: 320)
 --output-channels [num]   - Audio output channels (Default: 2)
 --output-samplerate [num] - Audio output samplerate (Default: 44100)
 --output-format [format]  - Audio output formats (Default: wav)
```

To make this works perfectly, Make sure `parec` binary is available in your system.

# OpenRadio Core
## `core`
Main Function of OpenRadio Core to creating new player __(Loaded from `require("openradio")`)__. Returns [`PassThrough`](https://nodejs.org/api/stream.html#stream_class_stream_passthrough)
#### Parameters (Optional)
 - `format` Radio audio format (Default: mp3)
 - `rate` Radio Audio rate (hz) (Default: 48000)
 - `channels` Radio Audio channels (Default: 2)
 - `bitrate` Radio Audio bitrate (Default: 96).
### `player.play`
A function for playing a song from provided readstream. Returns `Promise`. The promise only resolved when the song ended. This can used for queue system:
```js
async function intro () {
  await player.play(fs.createReadStream("intro_bgm.ogg"));
  // After 1st song ended, Next...
  await player.play(fs.createReadStream("info.ogg"));
  // Then next....
  await player.play(fs.createReadStream("outro_bgm.ogg"));
  await player.play(fs.createReadStream("Track 1.mp3"));
}
```
#### Parameters **(Required)**
  - `ReadStream` (Required) for reading stream.

Example:
```js
const openradio = require("openradio");
const player = openradio();

player.play(fs.createReadStream("song.mp3"));
```
### `player.playPCM`
Same as [`player.play`](#playerplay). But for playing PCM audio.

### Parameters
  - `ReadStream` (Required) for reading Stream
  - `PCM Info` PCM Information

#### `PCM Info`
  - `rate` Audio Samplerate (Default: 44100)
  - `channels` Audio Channels (Default: 2)
  
### `player.stream`
A object that returns [Readable Stream](https://nodejs.org/api/stream.html#stream_readable_streams) that created by openradio (Notice: You can't use `pipe` function). Returns `null` if there's nothing playing.
```js
const openradio = require("openradio");
const player = openradio();

player.play(fs.createReadStream("song.mp3"));
// End the song.
player.stream.end();
```

## `player.header`
A buffer of audio header that used to reveal radio audio information such as bitrate, samplerate, and etc so some audio player can understand what & how to do their job quickly. Returns `Buffer`.

### `player.on` 
Some event listener for player. [`ReadableStream`](https://nodejs.org/api/stream.html#stream_class_stream_readable) event is also emitted here.
  - `finish` event returns nothing when radio player finished playing a song.
  - `error` event returns error if there's a error. Very required in some cases.
```js
const openradio = require("openradio");
const player = openradio();

player.on('error', console.error);
```
### `player.finished`
Some player object statement for knows that the radio player is ended.

```js
const openradio = require("openradio");
const player = openradio();

player.finished;
// Returns false if it's playing... Both player.playing and player.ended will return false if there's nothing playing / It's new Player.
```
### `player.playing`
Some player object statement for knows that the radio player is playing a song.
```js
const openradio = require("openradio");
const player = openradio();

player.playing;
// Returns false if it's not playing... Both player.playing and player.ended will return false if there's nothing playing / It's new Player.
```

## Example

```js
const openradio = require("openradio");
const player = openradio();
const fs = require("fs");

player.play(fs.createReadStream("song.mp3"));

const http = require("http");
http.createServer((req, res) => {
   if (player.header) res.write(player.header);
   player.pipe(res);
}).listen(3000);
```
Other example is available at [Example directory](https://github.com/Yonle/openradio/tree/radio/example)

