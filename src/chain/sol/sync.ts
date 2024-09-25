import { PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
const { Buffer } = require("buffer");
const crypto = require("crypto");
import {BorshCoder, EventParser, Program, web3} from "@project-serum/anchor";
import { publicKey } from "@project-serum/anchor/dist/cjs/utils";
import { delay } from '../../utils/time'
import { Chain } from '../../config/config'
import { Log } from '../../storages/model'
import { insertMos } from '../../storages/mysql/mysql'
import { sign } from "crypto";

export class SolChain {
    cfg:Chain;
    constructor(cfg:Chain) {
      this.cfg = cfg
    }

    getName():string {
      return this.cfg.name
    }

    async sync() {
      console.log("web3.clusterApiUrl(cluster) ----------------- ", this.cfg.endpoint)
      let connection = new web3.Connection(this.cfg.endpoint, "confirmed");
      let constract  = new PublicKey(this.cfg.opts.mcs)
      let begin :string = this.cfg.opts.startBlock
      const idl = require("../../../src/chain/sol/chainpool.json");
      const programId = new PublicKey(idl.metadata.address);
      for (;;) {
        let signs = await connection.getSignaturesForAddress(constract, {
          until: begin,
          limit:100,
        })
        if (signs.length == 0) {
          await delay(3000)
          console.log("No new transaction, is waiting...")
          continue
        }
        for (let index = signs.length-1; index >= 0; index--) {
          let txHash = signs[index].signature
          const trx = await connection.getTransaction(txHash, {
              commitment: "confirmed",
              maxSupportedTransactionVersion:1,
          })
    
          const eventParser = new EventParser(programId, new BorshCoder(idl));
          let logs:string[] = trx?.meta?.logMessages!;
          const events = eventParser.parseLogs(logs);
          let haveBegin:boolean = false;
          let haveFinish:boolean = false;
          for (let event of events) {
              if (event.name == "CrossBeginEvent") {
                  haveBegin = true;
              }
              if (event.name == "CrossFinishEvent") {
                  haveFinish = true;
              }
              if (!haveBegin || !haveFinish) {
                continue
              }
              let isOut: boolean = ("crossOut" in event.data.crossType)
              if (!isOut) {
                console.log("Ignore tx", txHash, ",tx not crossout event", event.data.crossType)
                continue
              }
              console.log("Find tx", txHash, "slot", trx?.slot, "blockTime",trx?.blockTime)
              const orderId = Buffer.from(Uint8Array.from(event.data.orderRecord.orderId)).toString("hex");
              console.log("event.name ------------------- ", event.name)
              console.log("orderId ------------------ ", orderId)
              console.log(
                  `
                  CrossFinishEvent: orderId[${orderId}],
                  amount_out[${event.data.amountOut}],
                  tokenAmount[${event.data.orderRecord.tokenAmount}],
                  from[${event.data.orderRecord.from}],
                  fromToken[${event.data.orderRecord.fromToken}],
                  toToken[${event.data.orderRecord.toToken}],
                  swapTokenOutMinAmountOut[${event.data.orderRecord.swapTokenOutMinAmountOut}],
                  minAmountOut[${event.data.orderRecord.minAmountOut}], 
                  swapTokenOutBeforeBalance[${event.data.orderRecord.swapTokenOutBeforeBalance}], 
                  afterBalance[${event.data.afterBalance}],
                  receiver[${event.data.orderRecord.receiver}],
                  toChain[${event.data.orderRecord.toChainId}],
                  fromChainId[${event.data.orderRecord.fromChainId}]
                  `
              );
              let data = new Map()
              data.set("orderId", orderId)
              data.set("tokenAmount", event.data.orderRecord.tokenAmount)
              data.set("from", event.data.orderRecord.from)
              data.set("fromToken", event.data.orderRecord.fromToken)
              data.set("toToken", event.data.orderRecord.toToken)
              data.set("swapTokenOutMinAmountOut", event.data.orderRecord.swapTokenOutMinAmountOut)
              data.set("minAmountOut", event.data.orderRecord.minAmountOut)
              data.set("swapTokenOutBeforeBalance", event.data.orderRecord.swapTokenOutBeforeBalance)
              data.set("afterBalance", event.data.afterBalance)
              data.set("receiver", event.data.orderRecord.receiver)
              data.set("toChain", event.data.orderRecord.toChainId)
              data.set("fromChainId", event.data.orderRecord.fromChainId)
              data.set("amountOut", event.data.amountOut)
              let dataStr = JSON.stringify(Object.fromEntries(data))
              let blcokTime:number = trx?.blockTime!;
              // let currentDate = new Date();
              var l:Log = {
                ChainId: this.cfg.id,
                EventId: 98,
                ProjectId: 7,
                TxHash: txHash,
                ContractAddres: this.cfg.opts.mcs,
                Topic: "crossOut",
                BlockNumber: trx?.slot!,
                BlockHash:"",
                TxIndex: 1,
                LogIndex: 1,
                LogData: dataStr,
                TxTimestamp: blcokTime,
              }
              insertMos(l, (err:Error, id: number) => {
                if (err) {
                  console.log("Insert Failed, txHash:", txHash, "err:", err);
                  return
                }
                console.log("Insert Success, txHash:", txHash, "id:", id);
              })
            }
    
            begin = signs[index].signature;
          }
      }
  }
}

