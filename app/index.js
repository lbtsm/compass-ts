"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// import { PublicKey } from "@solana/web3.js";
// import * as anchor from "@project-serum/anchor";
// const { Buffer } = require("buffer");
// const crypto = require("crypto");
// import {BorshCoder, EventParser, Program, web3} from "@project-serum/anchor";
// import { publicKey } from "@project-serum/anchor/dist/cjs/utils";
// import chainer = require("./chain/chain");
const time_1 = require("./utils/time");
const config_1 = require("./config/config");
const mysql_1 = require("./storages/mysql/mysql");
const commander_1 = require("commander");
const version = (`1.0.0`);
const defCfgPath = "./config.json";
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // step1: flags
        const program = new commander_1.Command();
        program.name("filter-ts").
            description("CLI to filter solana tracsaction log").
            version(version);
        program.option('-c, --config <>');
        program.parse(process.argv);
        const options = program.opts();
        console.log(" ", options.config);
        let configPath = options.config;
        if (configPath == "") {
            configPath = defCfgPath;
        }
        console.log("input config path is: ", configPath);
        // step2: parse config
        let cfg = (0, config_1.parseConfig)(configPath);
        // step3: init storage
        (0, mysql_1.initDb)(cfg.storages[0].user, cfg.storages[0].psw, cfg.storages[0].db, cfg.storages[0].host, cfg.storages[0].port);
        // const db = mysql.createConnection({
        //   user:cfg.storages[0].user,
        //   password:cfg.storages[0].psw,
        //   database:cfg.storages[0].db,
        //   host:cfg.storages[0].host,
        //   port: cfg.storages[0].port,
        // });
        (0, mysql_1.queryEvent)();
        // step4: init chain
        // step5: filter
        // step6: sleep
        for (;;) {
            yield (0, time_1.delay)(3000);
        }
    });
}
main();
// export const create = (callback: Function) => {
//   // const queryString = "INSERT INTO ProductOrder (product_id, customer_id, product_quantity) VALUES (?, ?, ?)"
//   const queryString = "SELECT * FROM sys_api where id = ?"
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
