# Table of Content
- [OpenRadio CLI](#cli)
  - [Usage](#usage)
  - [Commands](#commands)
- [`core`](#core)
  - [`player.play`](#playerplay)
  - [`player.stream`](#playerstream)
  - [`player.on`](#playeron)
  - [`player.finished`](#playerfinished)
  - [`player.playing`](#playerplaying)
- [Example](#example)

# OpenRadio CLI
## CLI
Some openradio CLI that installed with `npm install -g openradio`
### Usage
```bash
openradio [Port] [Directory Path]
```
### Commands
```
skip - Skip & Play other song
np - Showing Current playing song name
q / ls - Showing song name in current folder
p - Skip & play provided song number
stop - Stop the player
logs - Show <HTTP/UDP/TCP> Traffic Logs
clearlogs - Clear logs
sink - Show all Sink name
loop - Loop the current song
random - Enable Random song fetching
pause - Pause the radio
resume - Resume the radio
```
# OpenRadio Core
## `core`
Main Function of OpenRadio Core to creating new player __(Loaded from `require("openradio")`)__. Returns [`PassThrough`](https://nodejs.org/api/stream.html#stream_class_stream_passthrough)
#### Parameters (Optional)
 - `format` Radio audio format (Default: mp3)
 - `rate` Radio Audio rate (hz) (Default: 48000)
 - `channels` Radio Audio channels (Default: 2)
 - `bitrate` Radio Audio bitrate (Default: 96)
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
```js
const openradio = require("openradio");
const player = openradio();

player.play(fs.createReadStream("song.mp3"));
```
### `player.stream`
A object that returns [Readable Stream](https://nodejs.org/api/stream.html#stream_readable_streams) that created by openradio (Notice: You can't use `pipe` function). Returns `null` if there's nothing playing.
```js
const openradio = require("openradio");
const player = openradio();

player.play(fs.createReadStream("song.mp3"));
// End the song.
player.stream.end();
```
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

player.play("song.mp3");

const http = require("http");
http.createServer((req, res) => {
   player.pipe(res);
}).listen(3000);
```
Other example is available at [Example directory](https://github.com/Yonle/openradio/tree/radio/example)

