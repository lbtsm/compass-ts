import { Config } from '../config/config';
interface IChain {
    getName: () => string;
    sync: () => void;
}
export declare function InitChain(cfg: Config): IChain[];
export {};
