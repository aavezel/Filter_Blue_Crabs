#!/usr/local/bin/node

var fs = require("fs");
var csv = require("csv");
var config = require("../config");

main();

function main() {
    if (!fs.existsSync(config.types_file)) {
        // eslint-disable-next-line quotes
        fs.writeFile(config.types_file, `"channel","type"\n`, (error) => {
            if (error) console.error(error);
        });
    }
    config.m3u.forEach((file) => fs.readFile(file, "utf8", parseM3U));
}

function parseM3U(err, data) {
    if (err) {
        console.error(err);
        return;
    }
    const playlist_str_split = data.split("\n").filter(f => f.startsWith("#EXTINF"));

    let result = [];
    for (let line of playlist_str_split) {
        const rx = /group-title="(.*)"[^,]*,(.*)/gi;
        const match = rx.exec(line);
        if (match && match.length == 3) {
            result.push([match[2], match[1]]);
        }
    }

    csv.stringify(result, {
        columns: ["channel", "type"],
        delimiter: ",",
        header: false,
        quoted: true
    }, writeData2File);
}

function writeData2File(err, data) {
    if (err) {
        console.error(err);
        return;
    }
    fs.appendFile(config.types_file, data, (error) => {
        if (error) throw error;
    });
}