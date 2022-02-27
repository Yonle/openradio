# openradio
Only some simple live stream library.

This library **require ffmpeg to be installed in your system/container**.

## Documentation
### module(options)
A function to create a new converter. Return [`stream.Duplex`](https://nodejs.org/api/stream.html#class-streamduplex).

#### Options
- `format` The radio audio format. Default is `mp3`.
- `rate` Radio audio samplerate. Default is `44100`.
- `channels` Radio audio channels. Default is `2`.
- `bitrate` Radio audio bitrate. Default is `192`.

#### Functions
- `play(ReadableStream)` A function to play audio from [`ReadableStream`](https://nodejs.org/api/stream.html#class-streamreadable).
- `playPCM(ReadableStream, options)` A function to play PCM audio from [`ReadableStream`](https://nodejs.org/api/stream.html#class-streamreadable). A options include:

 1. `rate`  The PCM audio bitrate. The default is `44100`.
 2. `channels` The PCM audio channels. The default is `2`.
 
#### Objects
 -  `stream` The source of current audio. Return [`ReadableStream`](https://nodejs.org/api/stream.html#class-streamreadable).

#### Events
Some of events from [`stream.Duplex`](https://nodejs.org/api/stream.html#class-streamduplex) also included here.

- `error` A event that emit some error when occured.
- `finish` A event that emit when finished playing the current song.

### module.video(options)
Just like the main function, But instead of audio, It's for Video.

#### Options
- `format` Radio video format. Default is `mpegts`.
- `arate` Radio video audio samplerate. Default is `44100`.
- `achannels` Radio video audio channels. Default is `2`.
- `abitrate` Radio video audio bitrate. Default is `192`.
- `acodec` Radio video audio codec. Default is `aac`.
- `size` Radio video resolution. Default is `1280x800`

#### Functions
- `play(ReadableStream)` A function to play video from [`ReadableStream`](https://nodejs.org/api/stream.html#class-streamreadable).

#### Events
Some of events from [`stream.Duplex`](https://nodejs.org/api/stream.html#class-streamduplex) also included here.

- `error` A event that emit some error when occured.
- `finish` A event that emit when finished playing the current video.


## Example
See [`example` folder](https://github.com/Yonle/openradio/tree/radio/example)

## Community
- [Telegram](https://t.me/yonlecoder)

## License
Copyright 2022 Yonle <yonle@duck.com>

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
