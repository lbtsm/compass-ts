import mysql from "mysql2";
export declare let db: mysql.Connection;
export declare function initDb(user: string, psw: string, database: string, host: string, port: number): void;
export declare function queryEvent(): void;
