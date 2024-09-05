export interface Config {
    chains: Chain[];
    other: Other;
    storages: Storage[];
}
interface Chain {
    name: string;
    type: string;
    id: string;
    endpoint: string;
    opt: ChainOpt;
}
interface ChainOpt {
    startBlock: string;
    blockConfirmations: string;
}
interface Storage {
    url: string;
    type: string;
    host: string;
    port: number;
    user: string;
    psw: string;
    db: string;
}
interface Other {
    monitorUrl: string;
    env: string;
}
export declare function parseConfig(path: string): Config;
export {};
