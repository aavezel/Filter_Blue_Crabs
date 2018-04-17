const fetch = require('node-fetch');
const fs = require('fs');
const csv = require('csv')

const playlistUrl = "http://.../Free.m3u";
const typesFile = "..../types.csv";
const playlistSaveFile = "...../Free.m3u";


function getTypes() {
    return new Promise((resolve, reject) => {
        fs.readFile(typesFile, "utf8", (err, data) => {
            if (err) {
                reject(err)
                return;
            }
            csv.parse(data, {
                columns: true
            }, (err, objs) => {
                if (err) {
                    reject(err)
                    return;
                }
                resolve(objs);
            });
        });
    })
}

function getPlayList() {
    return new Promise((resolve, reject) => {
        fetch(playlistUrl).then(
            (data) => {
                data.text().then((text) => {
                    resolve(text);
                })
            }
        ).catch((err) => reject(err));
    });
}

function savePlayList(playlist) {
    return new Promise((resolve, reject) => {
        fs.writeFile(playlistSaveFile, playlist, "utf-8", (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        })
    });
}

function filter_playlist(channel_name, channel_type) {
    if (channel_type == "Украинские") return false;
    if (channel_type == "Молдова") return false;
    if (channel_type == "Белорусские") return false;
    if (channel_type == "Казахстан") return false;
    if (channel_type == "Кыргызстан") return false;
    if (channel_type == "Иностранные") return false;
    if (channel_type == "Музыка") return false;
    if (channel_type == "Мода") return false;
    if (channel_type == "Магазин") return false;
    if (channel_type == "Для взрослых") return false;
    return true;
}

function patchPlaylits(playlist, types, filter_playlist) {
    const dict = types.reduce((p, e) => {
        p[e.channel.toLowerCase()] = e.type;
        return p
    }, {})
    const rx = /(#EXTINF:-1),(.*)/i;
    const result = [];
    let skip = false;
    for (let line of playlist.split("\n")) {
        if (skip) {
            skip = false;
            continue;
        }
        const match = rx.exec(line)
        if (match && match.length == 3) {
            const channel_name = match[2];
            const channel_name_l = channel_name.toLowerCase();
            if (channel_name_l in dict) {
                const channel_type = dict[channel_name_l];
                if (filter_playlist(channel_name, channel_type)) {
                    let s = match[1] + ` group-title="${channel_type}",` + match[2]
                    result.push(s);
                } else {
                    skip = true;
                }
            } else {
                console.log(`Тип канала ${channel_name} не извесен`);
                if (filter_playlist(channel_name, null)) {
                    result.push(line);
                } else {
                    skip = true;
                }
            }
        } else {
            result.push(line)
        }
    }
    return result.join("\n");

}

function main() {
    getTypes().then(types => {
        getPlayList().then(playlist_str => {
            const new_playlist = patchPlaylits(playlist_str, types, filter_playlist);
            savePlayList(new_playlist).then(
                () => console.log("all ok")
            )
        })
    });
}

main();