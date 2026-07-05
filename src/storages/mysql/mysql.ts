import mysql from "mysql2";
import { ResultSetHeader } from "mysql2";
import { Log } from '../model'

export let db: mysql.Connection;
export let pool: mysql.Pool;

export function initDb(user: string, psw: string, database: string, host: string, port: number) {
  pool = mysql.createPool({
    user: user,
    password: psw,
    database: database,
    host: host,
    port: port,
  })
}

type InsertCallback = (error: Error | null, id?: number) => void;

export const insertMos = (log: Log, callback?: InsertCallback): Promise<number> => {
  return new Promise((resolve, reject) => {
    pool.getConnection((error, connection) => {
      if (error) {
        callback?.(error);
        reject(error);
        return;
      }

      const insertStr = "INSERT INTO mos (chain_id, event_id, project_id, tx_hash, contract_address, topic, block_number, block_hash, tx_index, log_index, log_data, tx_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      connection.query(
        insertStr,
        [
          log.ChainId,
          log.EventId,
          log.ProjectId,
          log.TxHash,
          log.ContractAddres,
          log.Topic,
          log.BlockNumber,
          log.BlockHash,
          log.TxIndex,
          log.LogIndex,
          log.LogData,
          log.TxTimestamp,
        ],
        (queryError, result) => {
          connection.release();

          if (queryError) {
            if (isDuplicateEntryError(queryError)) {
              console.log("Skip duplicate mos log, txHash:", log.TxHash, "err:", queryError.message);
              callback?.(null, 0);
              resolve(0);
              return;
            }

            callback?.(queryError);
            reject(queryError);
            return;
          }

          const insertId = (result as ResultSetHeader).insertId;
          callback?.(null, insertId);
          resolve(insertId);
        },
      );
    });
  });
};

function isDuplicateEntryError(error: Error): boolean {
  const mysqlError = error as Error & { code?: string; errno?: number };
  return mysqlError.code === "ER_DUP_ENTRY" || mysqlError.errno === 1062;
}
