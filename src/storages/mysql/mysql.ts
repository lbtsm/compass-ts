import mysql from "mysql2";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { Log } from '../model'


export let db:mysql.Connection;

export function initDb(user:string, psw:string, database:string, host:string, port:number) {
    db = mysql.createConnection({
        user:user,
        password:psw,
        database:database,
        host:host,
        port:port,
        waitForConnections:true,
        connectTimeout:60,
    });
}

export function queryEvent() {
    const queryString = "SELECT * FROM event where id = ?"

    db.query(
        queryString,
        [5],
        (err, result) => {
        if (err) {
            console.log("err ------------------- ", err)
            return
        };
        
        console.log("result --------- ",result);
        const row = (<RowDataPacket> result)[0];
        console.log("row --------- ",row.id);
        console.log("row --------- ",row.handle);
        console.log("row --------- ",row.title);
        console.log("row --------- ",row.path);
        console.log("row --------- ",row.type);
        console.log("row --------- ",row.action);
        console.log("row --------- ",row.created_at);
        }
    );
}

export const insertMos = (log: Log, callback: Function) => {
  try {
    const insertStr = "INSERT INTO mos (chain_id, event_id, project_id, tx_hash, contract_address, topic, block_number, block_hash, tx_index, log_index, log_data, tx_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    db.query(
      insertStr,
      [log.ChainId, log.EventId, log.ProjectId,  log.TxHash, log.ContractAddres, log.Topic, log.BlockNumber, 
        log.BlockHash, log.TxIndex, log.LogIndex, log.LogData, log.TxTimestamp],
      (err, result) => {
        if (err) {
          callback(err)
          return
        };
  
        const insertId = (<ResultSetHeader> result).insertId;
        callback(null, insertId);
      }
    );
  } catch {

  }
  
};