import { PublicKey } from "@solana/web3.js";
const { Buffer } = require("buffer");
const crypto = require("crypto");
import {BorshCoder, EventParser, Event, Program, web3} from "@project-serum/anchor";
import {VersionedTransactionResponse} from "@solana/web3.js";
import { publicKey, } from "@project-serum/anchor/dist/cjs/utils";
import { delay } from '../../utils/time'
import { Chain } from '../../config/config'
import { Log } from '../../storages/model'
import { insertMos } from '../../storages/mysql/mysql'
import { sign } from "crypto";
import { error, time } from "console";
import { start } from "repl";

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
      let connection = new web3.Connection(this.cfg.endpoint);
      let constract  = new PublicKey(this.cfg.opts.mcs)
      let begin :string = this.cfg.opts.startBlock
      // sol2evm
      const idl = require("../../../src/chain/sol/chainpool.json");
      const programId = new PublicKey(idl.metadata.address);
      // messageout
      const messoutIdl = require("../../../src/chain/sol/messout.json");
      const outProgramId = new PublicKey(messoutIdl.metadata.address);
      for (;;) {
        try {
          console.log("begin ------------------ ", begin)
          let signs = await connection.getSignaturesForAddress(constract, {
            until: begin,
            limit:10,
          })

          if (signs == null || signs.length == 0) {
            await delay(3000)
            continue
          }
          for (let index = signs.length-1; index >= 0; index--) {
            let txHash = signs[index].signature
            console.log("txHash --------------------------- ", txHash)
            const trx = await connection.getTransaction(txHash, {
                commitment: "confirmed",
                maxSupportedTransactionVersion:1,
            })
            // sol2evm
            // corssOut 事件
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
              this.crossOut(event, haveBegin, haveFinish,txHash, trx)
            }
             // messageOut
            let outLogs:string[] = trx?.meta?.logMessages!;
            const messageOutEp = new EventParser(outProgramId, new BorshCoder(messoutIdl));
            const outEvents = messageOutEp.parseLogs(outLogs);
            for (let event of outEvents) {
             this.messageOut(event, txHash, trx)
            }

            // begin = signs[index].signature;
          }
        } catch (err){
          console.log("solana catch err", err)
          await delay(3000)
        } finally {
          console.log("solana filter is running")
          await delay(3000)
        }
      }
    }

    crossOut(event:Event, haveBegin:boolean, haveFinish:boolean, txHash:string, trx:VersionedTransactionResponse|null) {
      if (!haveBegin || !haveFinish) {
        return
      }
      let isOut: boolean = ("crossOut" in event.data.crossType)
      if (!isOut) {
        console.log("Ignore tx", txHash, ",tx not crossout event", event.data.crossType)
        return
      }
      console.log("Find CrossOut tx", txHash, "slot", trx?.slot, "blockTime",trx?.blockTime)
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
          swapTokenOut[${event.data.orderRecord.swapTokenOut}],
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
      data.set("swapTokenOut", event.data.orderRecord.swapTokenOut)
      data.set("swapTokenOutMinAmountOut", event.data.orderRecord.swapTokenOutMinAmountOut)
      data.set("minAmountOut", event.data.orderRecord.minAmountOut)
      data.set("swapTokenOutBeforeBalance", event.data.orderRecord.swapTokenOutBeforeBalance)
      data.set("afterBalance", event.data.afterBalance)
      data.set("receiver", event.data.orderRecord.receiver)
      data.set("toChain", event.data.orderRecord.toChainId)
      data.set("fromChainId", event.data.orderRecord.fromChainId)
      data.set("amountOut", event.data.amountOut)
      let dataStr = JSON.stringify(Object.fromEntries(data))
      var l:Log = {
        ChainId: this.cfg.id,
        EventId: 98,
        ProjectId: 7,
        TxHash: txHash,
        ContractAddres: this.cfg.opts.mcs,
        Topic: "crossOut",
        BlockNumber: trx?.slot || 0,
        BlockHash:"",
        TxIndex: 1,
        LogIndex: 1,
        LogData: dataStr,
        TxTimestamp: trx?.blockTime || 0,
      }
      insertMos(l, (err:Error, id: number) => {
        if (err) {
          console.log("CrossOut Insert Failed, txHash:", txHash, "err:", err);
          return
        }
        console.log("CrossOut Insert Success, txHash:", txHash, "id:", id);
      })
    }

    messageOut(event:Event, txHash:string, trx:VersionedTransactionResponse|null) {
       if (event.name != "MessageOutEvent") {
         console.log("------------------ event.name ", event.name)
         return
       }

      const orderId = Buffer.from(Uint8Array.from(event.data.orderId)).toString("hex");
      const mos = Buffer.from(Uint8Array.from(event.data.mos)).toString("hex");
      const to = Buffer.from(Uint8Array.from(event.data.to)).toString("hex");
      const swapData = Buffer.from(Uint8Array.from(event.data.swapData)).toString("hex");

      const token = Buffer.from(new PublicKey(event.data.token).toBytes()).toString("hex");
      const initiator = Buffer.from(new PublicKey(event.data.initiator).toBytes()).toString("hex");
      const from = Buffer.from(new PublicKey(event.data.from).toBytes()).toString("hex");

      console.log("Find MessageOut tx", txHash, "slot", trx?.slot, "blockTime",trx?.blockTime)
      console.log(`
        MessageOutEvent: orderId[${orderId}],
        MessageOutEvent: relay[${event.data.relay}],
        MessageOutEvent: messageType[${event.data.messageType}],
        MessageOutEvent: fromChain[${event.data.fromChain}],
        MessageOutEvent: toChain[${event.data.toChain}],
        MessageOutEvent: mos[${mos}],
        MessageOutEvent: token[${event.data.token}],
        MessageOutEvent: initiator[${event.data.initiator}],
        MessageOutEvent: from[${event.data.from}],
        MessageOutEvent: to[${to}],
        MessageOutEvent: amount[${event.data.amount}],
        MessageOutEvent: gasLimit[${event.data.gasLimit}],
        MessageOutEvent: swapData[${event.data.swapData}]
      `)
       let data = new Map()
       data.set("orderId", orderId)
       data.set("relay", event.data.relay)
       data.set("messageType", event.data.messageType)
       data.set("fromChain", event.data.fromChain)
       data.set("toChain", event.data.toChain)
       data.set("mos", mos)
       data.set("token", token)
       data.set("initiator", initiator)
       data.set("from", from)
       data.set("to", to)
       data.set("amount", event.data.amount)
       data.set("gasLimit", event.data.gasLimit)
       data.set("swapData", swapData)
       let dataStr = JSON.stringify(Object.fromEntries(data))
       var l:Log = {
         ChainId: this.cfg.id,
         EventId: 110,
         ProjectId: 1,
         TxHash: txHash,
         ContractAddres: this.cfg.opts.mcs,
         Topic: "MessageOutEvent",
         BlockNumber: trx?.slot || 0,
         BlockHash:"",
         TxIndex: 1,
         LogIndex: 1,
         LogData: dataStr,
         TxTimestamp:  trx?.blockTime || 0,
       }
       insertMos(l, (err:Error, id: number) => {
         if (err) {
           console.log("MessageOut Insert Failed, txHash:", txHash, "err:", err);
           return
         }
         console.log("MessageOut Insert Success, txHash:", txHash, "id:", id);
       })
    }

}