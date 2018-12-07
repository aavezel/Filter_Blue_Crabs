#!/usr/local/bin/node

const fetch = require("node-fetch");
const fs = require("fs");
const csv = require("csv");
const config = require("../config");

main();

async function main() {
    try {
        const [types, playlist] = await Promise.all([getTypes(), getPlayList()]);
        const new_playlist = patchPlaylits(playlist, types);
        await savePlayList(new_playlist);
        console.log("all ok");
    } catch (e) {
        console.error(e);
    }
}

async function readTypesFile(){
    return new Promise((res, rej) => {
        fs.readFile(config.types_file, "utf8", (err, data) => {
            if (err) rej(err);
            else res(data);
        });
    });
}

async function parseCSV(data, option){
    return new Promise((res, rej) => {
        csv.parse(data, option, (err, data) => {
            if (err) rej(err);
            else res(data);
        });
    });
}

async function savePlayList(playlist) {
    return new Promise((resolve, reject) => {
        fs.writeFile(config.save_file, playlist, "utf-8", (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

async function getTypes() {
    const data = await readTypesFile();
    const table = await parseCSV(data, {
        columns: true
    });
    return table;
}

async function getPlayList() {
    const data = await fetch(config.original_url);
    const text = await data.text();
    return text;
}

function filter_playlist(channel_name, channel_type) {
    return (config.skipChannel.indexOf(channel_type) == -1) && (config.skipTypes.indexOf(channel_type) == -1);
}

function patchPlaylits(playlist, types) {
    const dictLowerCaseChannels = types.reduce((p, e) => {
        p[e.channel.toLowerCase()] = e.type;
        return p;
    }, {});
    const rx = /(#EXTINF:-1),(.*)/i;
    const result = [];
    let skipNextLine = false;
    const statistics = {};
    for (const line of playlist.split("\n")) {
        if (skipNextLine) {
            skipNextLine = false;
            continue;
        }
        const match = rx.exec(line);
        if (match && match.length == 3) {
            const channel_name = match[2];
            const channel_name_lowerCase = channel_name.toLowerCase();
            if (channel_name_lowerCase in dictLowerCaseChannels) {
                const channel_type = dictLowerCaseChannels[channel_name_lowerCase];
                if (filter_playlist(channel_name, channel_type)) {
                    let s = match[1] + ` group-title="${channel_type}",` + match[2];
                    statistics[channel_type] = statistics[channel_type] + 1 || 1;
                    result.push(s);
                } else {
                    skipNextLine = true;
                }
            } else {
                console.warn(`Тип канала ${channel_name} не извесен`);

                if (filter_playlist(channel_name, null)) {
                    result.push(line);
                } else {
                    skipNextLine = true;
                }
            }
        } else {
            fixGoodgame(line, result);
            result.push(line);
        }
    }
    showStatistic(statistics);
    return result.join("\n");
}

function showStatistic(statistics) {
    const all = Object.values(statistics).reduce((s, v) => s + v, 0);
    console.log(`Всего: ${all} `);
    Object.keys(statistics)
        .sort((a, b) => statistics[b] - statistics[a])
        .forEach(channel_type => console.log(`${channel_type}: ${statistics[channel_type]}`));
    console.log("");
}

function fixGoodgame(line, result) {
    if (line.startsWith("http://hls.goodgame.ru")) {
        result.push("#EXTVLCOPT:http-user-agent=Mozilla/5.0 (X11; Linux x86_64; rv:10.0.7)");
    }
}