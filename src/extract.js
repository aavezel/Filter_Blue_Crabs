#!/usr/local/bin/node

var fs = require("fs");
var csv = require("csv");
var config = require("../config");

main();

async function main() {
    await createTypesFileIfNeeded();
    config.m3u.forEach(async (file) => {
        try {
            const data = await loadFile(file);
            const table = parseM3U(data);
            const csv_string = await stringifyCSV(table);
            await writeToFile(csv_string);
        } catch (e) {
            console.error(`Не удалось распарсить файл ${file}. Ошибка ${e}`);
        }
    });
    console.log("All ok");
}

async function createTypesFileIfNeeded() {
    const exist = await checkExistsTypesFile();
    if (!exist) {
        await writeHeader();
    }
}

async function checkExistsTypesFile() {
    return new Promise((res) => {
        fs.exists(config.types_file, (exists) => {
            res(exists);
        });
    });
}

async function writeHeader() {
    return new Promise((res, rej) => {
        // eslint-disable-next-line quotes
        fs.writeFile(config.types_file, `"channel","type"\n`, (error) => {
            if (error) rej(error);
            else res();
        });
    });
}

async function loadFile(file_name) {
    return new Promise((res, rej) => {
        fs.readFile(file_name, "utf8", (error, data) => {
            if (error) rej(error);
            else res(data);
        });
    });
}



function parseM3U(data) {
    const playlist_str_split = data.split("\n").filter(f => f.startsWith("#EXTINF"));

    let result = [];
    for (let line of playlist_str_split) {
        const rx = /group-title="(.*)"[^,]*,(.*)/gi;
        const match = rx.exec(line);
        if (match && match.length == 3) {
            result.push([match[2], match[1]]);
        }
    }

    return result;
}

async function stringifyCSV(table) {
    return new Promise((res, rej) => {
        csv.stringify(
            table, {
                columns: ["channel", "type"],
                delimiter: ",",
                header: false,
                quoted: true
            },
            (err, table) => {
                if (err) rej(err);
                else res(table);
            }
        );
    });
}

async function writeToFile(data) {
    return new Promise((res, rej) => {
        fs.appendFile(config.types_file, data, (err) => {
            if (err) rej(err);
            else res();
        });
    });
}