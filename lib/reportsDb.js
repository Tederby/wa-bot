import fs from "fs";
import path from "path";

function getFile(type) {
    return path.resolve(process.cwd(), `database_${type}s.json`);
}

function readDB(type) {
    const file = getFile(type);
    if (!fs.existsSync(file)) return [];
    try {
        return JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch (e) {
        return [];
    }
}

function writeDB(type, data) {
    const file = getFile(type);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

export function addReport(type, sender, pushname, text, isGroup, groupName) {
    const db = readDB(type);
    const newItem = {
        id: db.length > 0 ? Math.max(...db.map(d => d.id)) + 1 : 1,
        sender,
        pushname,
        text,
        isGroup,
        groupName: groupName || null,
        timestamp: Date.now()
    };
    db.push(newItem);
    writeDB(type, db);
    return newItem;
}

export function getReports(type) {
    return readDB(type);
}

export function deleteReport(type, id) {
    let db = readDB(type);
    const initialLen = db.length;
    db = db.filter(item => item.id !== id);
    if (db.length !== initialLen) {
        writeDB(type, db);
        return true;
    }
    return false;
}
