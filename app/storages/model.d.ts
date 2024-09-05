export interface Log {
    ChainId: string;
    EventId: string;
    ProjectId: string;
    TxHash: string;
    ContractAddres: string;
    Topic: string;
    BlockNumber: string;
    BlockHash: string;
    TxIndex: number;
    LogIndex: number;
    LogData: string;
    TxTimestamp: number;
}
export interface Storage {
    GetEvent(): void;
}
