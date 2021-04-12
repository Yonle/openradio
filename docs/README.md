# Table of Content
- [OpenRadio CLI](#cli)
  - [Usage](#usage)
- [`core`](#core)
  - [`player.play`](#playerplay)
  - [`player.stream`](#playerstream)
  - [`player.on`](#playeron)
  - [`player.ended`](#playerended)
  - [`player.playing`](#playerplaying)
  - [`player.pipe`](#playerpipe)
- [Caution](#caution)

# OpenRadio CLI
## CLI
Some openradio CLI that installed with `npm install -g openradio`
### Usage
```bash
openradio [Port] [Directory Path]
```

# OpenRadio Core
## `core`
Main Function of OpenRadio Core for creating new player __(Loaded from `require("openradio")`)__
#### Parameters (Optional)
 - `format` Radio audio format (Default: mp3)
 - `rate` Radio Audio rate (hz) (Default: 48000)
 - `channels` Radio Audio channels (Default: 2)
 - `bitrate` Radio Audio bitrate (Default: 96)
### `player.play`
A function for playing a song from provided readstream.
#### Parameters **(Required)**
  - `ReadStream` (Required) for reading stream.
### `player.sink`
Some object variable that returns `Map()` for managing sink/WriteStream. `player.sink.deleteAll` function is for deleteing all WriteStream inside sink Map.

### `player.stream`
A object that returns throttled stream that created by openradio (Notice: You can't use `pipe` function). Returns `null` if there's nothing playing.
### `player.on` 
Some event listener for player. 
  - `data` event returns buffer.
  - `end` event returns nothing when radio player is ended.
  - `error` event returns error if there's a error.

### `player.ended`
Some player object statement for knows that the radio player is ended.

### `player.playing`
Some player object statement for knows that the radio player is playing a song.

### `player.pipe`
A function for writting a incomming buffer from radio player. Returns Writable Stream ID for managing sink. 

<center>

<h1>Caution</h1>

If you want skipping a song, Do not do this:

```js
// Your 1st Broadcast
player.play(....);

// Skipping? DO NOT DO THIS
player.play(....);
```

Do this:

```js
// Your 1st Broadcast
player.play(....);

// Skipping? End the player first!!
player.stream.end(() => {
   player.play(....)
});
```

</center>
