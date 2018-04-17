#!/usr/local/bin/node

var fs = require('fs');
var csv = require('csv')
const dir = ".../playlists/"

fs.readFile(dir + "types.csv", "utf8", (err, data) => {
    csv.parse(data, {
        columns: true
    }, (err, objs) => {
        if (err) {
            console.log(err);
            return;
        }
        const dict = {};
        const dict_lower = {};
        let need_uniq = false;
        let can_uniq = true;
        for (let obj of objs) {
            if (obj.channel in dict) {
                const type = dict[obj.channel];
                need_uniq = true;
                if (type != obj.type) {
                    console.log(`Канал ${obj.channel} имеет несколько типов ${obj.type} и ${type}`)
                    can_uniq = false;
                }
            } else {
                if (obj.channel.toLowerCase() in dict_lower) {
                    console.log(`Канал ${obj.channel} есть в разных раскладках`)
                }
                dict[obj.channel] = obj.type;
                dict_lower[obj.channel.toLowerCase()] = 1;
            }
        }
        if (need_uniq && can_uniq) {
            const uniq = []
            for (const channel_name in dict) {
                if (dict.hasOwnProperty(channel_name)) {
                    const channel_type = dict[channel_name];
                    uniq.push([channel_name, channel_type]);
                }
            }
            csv.stringify(uniq, {
                    columns: ["channel", "type"],
                    delimiter: ",",
                    header: true,
                    quoted: true
                }, (err, data) =>
                fs.writeFile(dir + "types.csv", data, (err, data) => console.log("Ok"))
            );
        } else {
            if (need_uniq) console.log("has error")
            else console.log("all ok")
        }

    })
});