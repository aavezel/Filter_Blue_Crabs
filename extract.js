#!/usr/local/bin/node

var fs = require('fs');
var csv = require('csv')
const dir = ".../playlists/"

fs.readFile(dir + "test.m3u", "utf8", (err, data) => {

    const playlist_str_split = data.split("\n").filter(f => f.startsWith("#EXTINF"))

    let result = [];
    for (let line of playlist_str_split) {
        const rx = /group-title="(.*)"[^,]*,(.*)/gi
        const match = rx.exec(line)
        if (match.length == 3) {
            result.push([match[2], match[1]]);
        }
    }

    const exist = fs.existsSync(dir + "type.csv")

    csv.stringify(result, {
            columns: ["channel", "type"],
            delimiter: ",",
            header: exist,
            quoted: true
        }, (err, data) =>
        fs.appendFile(dir + "types.csv", (exist ? "\n" : "") + data, (err, data) => console.log("Ok"))
    );

})