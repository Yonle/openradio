# openradio
A package that can be used to create your own livestream radio. Very easy to use for beginner.

## Install
```bash
npm install -g openradio
```
**NOTE:** You must have ffmpeg installed.
## Example
```bash
# Go to your directory that contain .mp3 files.
cd /home/Yonle/Music

# Start the Server
openradio
```

## Usage
When there's no argument provided, openradio will listen to port 4600 and Reading your current Directory files.
```bash
openradio [PORT] [DIRECTORY PATH]
```

## Command
```
.skip - Skip & Play other song
.np - Showing Current playing song name
.q / .ls - Showing song name in current folder
.p - Skip & play provided song number
.stop - Stop the player
.logs - Show HTTP Traffic Logs
.clearlogs - Clear logs
.sink - Show all Sink name
```
## Community
[Discord](https://discord.gg/9S3ZCDR)
