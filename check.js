#!/usr/local/bin/node

var fs = require("fs");
var csv = require("csv");
var config = require("./config");

main();

async function main() {
    try {
        const data = await readTypes();
        const table = await parseFile(data);
        const {
            uniq,
            types
        } = await parseCSV(table);
        const dataOut = await stringifyCSV(uniq);
        await saveTypes(dataOut);
        showTypes(types);
        console.log("Файл сохранен");
    } catch (ex) {
        console.error(ex);
    }
}

async function readTypes() {
    return new Promise((res, rej) => {
        fs.readFile(config.types_file, "utf8", (err, data) => {
            if (err) rej(err);
            else res(data);
        });
    });
}

async function saveTypes(types) {
    return new Promise((res, rej) => {
        fs.writeFile(config.types_file, types, (err) => {
            if (err) rej(err);
            else res();
        });
    });
}

async function showTypes(types) {
    Object.keys(types)
        .sort((a, b) => types[b] - types[a])
        .forEach(type => console.log(`${type}: ${types[type]}`));
    console.log("");
}

async function parseCSV(objects) {
    const dict = {};
    const dict_lower = {};
    const types = {};
    let has_error = false;
    for (const object of objects) {
        if (object.type.trim() == "") {
            console.log(
                `Канал ${object.channel} имеет пустой тип`
            );
            has_error = true;
        }
        if (object.channel in dict) {
            const type = dict[object.channel];
            if (type != object.type) {
                console.log(
                    `Канал ${object.channel} имеет несколько типов ${object.type} и ${type}`
                );
                has_error = true;
            }
        } else {
            if (object.channel.toLowerCase() in dict_lower) {
                console.log(`Канал ${object.channel} есть в разных раскладках`);
                has_error = true;
            }
            dict[object.channel] = object.type;
            dict_lower[object.channel.toLowerCase()] = 1;
            types[object.type] = ++types[object.type] || 1;
        }
    }
    if (has_error) {
        throw "Есть ошибки парсинга";
    }
    const channel_names = Object.keys(dict);
    channel_names.sort();
    const uniq = channel_names.map((channel_name) => [channel_name, dict[channel_name]]);
    return {
        uniq,
        types
    };
}

async function stringifyCSV(table) {
    return new Promise((res, rej) => {
        csv.stringify(
            table, {
                columns: ["channel", "type"],
                delimiter: ",",
                header: true,
                quoted: true
            },
            (err, table) => {
                if (err) rej(err);
                else res(table);
            }
        );
    });
}

async function parseFile(data) {
    return new Promise((res, rej) => {
        csv.parse(data, {
            columns: true
        }, (err, table) => {
            if (err) rej(err);
            else res(table);
        });
    });

}