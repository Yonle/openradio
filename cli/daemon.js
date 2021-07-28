// https://wiki.unix7.org/node/daemon-sample
var child_process = require('child_process');
var { writeFileSync } = require('fs');
 
function child(exe, args, env) {
    var child = child_process.spawn(exe, args, { 
            detached: true,
            stdio: ['ignore', 'ignore', 'ignore'],
            env: env
    })
    child.unref()
    return child
}
 
module.exports = function(nodeBin) {
    console.log('Daemon PID :', process.pid);
    console.log('Daemon PPID:', process.ppid);
    console.log(`\nTo kill server, Run \"openradio-pulse -k\"`);
	writeFileSync(process.env.TMPDIR + "/openradio-pulse-daemon.json", JSON.stringify({ pid: process.pid, ppid: process.ppid }));
	
    if (process.env.__daemon) {
        return process.pid
    }
    process.env.__daemon = true
 
    var args = [].concat(process.argv)
    var node = args.shift()
    var env = process.env
    child(node, args, env)
    return process.exit()
}