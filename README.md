# openradio
Let you create your own livestream radio.

## Installation
Before installing OpenRadio, You must have [ffmpeg](https://ffmpeg.org) installed on your system.
```bash
# OpenRadio CLI Installation
npm install -g openradio
# OpenRadio Core Installation
npm install openradio
```
# Example
```js
const openradio = require("openradio");
const player = openradio();

player.play(fs.createReadStream("audio.mp3"));
// After this function, A player is now broadcasting a song. 
// Do player.pipe(writable) after this.
```

#### For OpenRadio CLI
```bash
# Go to some directory that contains any audio files....
cd /home/Yonle/Music
# Start the radio
openradio
# You can also Listen to another Port
openradio 8080
```
## Useful Link
- [GitHub](https://github.com/Yonle/openradio)
- [Docs](https://github.com/Yonle/openradio/tree/radio/docs)
- [Example](https://github.com/Yonle/openradio/tree/radio/example)

## Community
- [Telegram](https://t.me/yonlecoder)
