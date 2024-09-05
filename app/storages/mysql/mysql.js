"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryEvent = exports.initDb = exports.db = void 0;
const mysql2_1 = __importDefault(require("mysql2"));
function initDb(user, psw, database, host, port) {
    exports.db = mysql2_1.default.createConnection({
        user: user,
        password: psw,
        database: database,
        host: host,
        port: port,
    });
}
exports.initDb = initDb;
function queryEvent() {
    const queryString = "SELECT * FROM sys_api where id = ?";
    exports.db.query(queryString, [5], (err, result) => {
        if (err) {
            console.log("err ------------------- ", err);
            return;
        }
        ;
        console.log("result --------- ", result);
        const row = result[0];
        console.log("row --------- ", row.id);
        console.log("row --------- ", row.handle);
        console.log("row --------- ", row.title);
        console.log("row --------- ", row.path);
        console.log("row --------- ", row.type);
        console.log("row --------- ", row.action);
        console.log("row --------- ", row.created_at);
    });
}
exports.queryEvent = queryEvent;
// export const Insert = () => {
//   const queryString = "INSERT INTO mos (chain_id, event_id, project_id) VALUES (?, ?, ?)"
//   db.query(
//     queryString,
//     [5],
//     (err, result) => {
//       if (err) {callback(err)};
//       const insertId = (<OkPacket> result).insertId;
//       callback(null, insertId);
//     }
//   );
// };
