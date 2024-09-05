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
const web3_js_1 = require("@solana/web3.js");
const { Buffer } = require("buffer");
const crypto = require("crypto");
const anchor_1 = require("@project-serum/anchor");
const time_1 = require("../../utils/time");
class Chain {
}
function parseLog() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let connection = new anchor_1.web3.Connection(anchor_1.web3.clusterApiUrl("devnet"), "confirmed");
        let constract = new web3_js_1.PublicKey("B6rMLK5baKzh7uKTX9GnvaX1VLBZ8eYtZoEGpYkvwCVF");
        let begin = "XRikYmWM3JR9cx5xDq981iqBHxjQC5mn3aDxLD6rvzY3TYofzw6gocp5WkZVi1wTchuJToyXgbh3TRgo7vaAc5S";
        const idl = require("../src/chain/sol/chainpool.json");
        const programId = new web3_js_1.PublicKey(idl.metadata.address);
        for (;;) {
            let signs = yield connection.getSignaturesForAddress(constract, {
                until: begin,
                limit: 100,
                // minContextSlot:321796048,
            });
            if (signs.length == 0) {
                yield (0, time_1.delay)(3000);
                console.log("No new transaction, is waiting...");
                continue;
            }
            for (let index = signs.length - 1; index >= 0; index--) {
                console.log("get sign index", index, "txTash", signs[index].signature);
                let txHash = signs[index].signature;
                const trx = yield connection.getTransaction(txHash, {
                    commitment: "confirmed",
                    maxSupportedTransactionVersion: 1,
                });
                const eventParser = new anchor_1.EventParser(programId, new anchor_1.BorshCoder(idl));
                let logs = (_a = trx === null || trx === void 0 ? void 0 : trx.meta) === null || _a === void 0 ? void 0 : _a.logMessages;
                const events = eventParser.parseLogs(logs);
                let haveBegin = false;
                let haveFinish = false;
                for (let event of events) {
                    if (event.name == "CrossBeginEvent") {
                        haveBegin = true;
                    }
                    if (event.name == "CrossFinishEvent") {
                        haveFinish = true;
                    }
                    if (!haveBegin || !haveFinish) {
                        continue;
                    }
                    let isOut = ("crossOut" in event.data.crossType);
                    if (!isOut) {
                        console.log("Ignore tx", txHash, ",tx have crossBegin and crossEnd, but not crossout", event.data.crossType);
                        continue;
                    }
                    console.log("Find tx", txHash);
                    const orderId = Buffer.from(Uint8Array.from(event.data.orderRecord.orderId)).toString("hex");
                    console.log("event.name ------------------- ", event.name);
                    console.log("orderId ------------------ ", orderId);
                    // console.log(
                    //     `
                    //     CrossFinishEvent: orderId[${orderId}],
                    //     tokenAmount[${event.data.orderRecord.tokenAmount}],
                    //     fromChainId[${event.data.orderRecord.fromChainId}],
                    //     from[${event.data.orderRecord.from}],
                    //     fromToken[${event.data.orderRecord.fromToken}],
                    //     toToken[${event.data.orderRecord.toToken}],
                    //     swapTokenOutMinAmountOut[${event.data.orderRecord.swapTokenOutMinAmountOut}],
                    //     minAmountOut[${event.data.orderRecord.minAmountOut}], 
                    //     crossType[${event.data.crossType}],
                    //     swapTokenOutBeforeBalance[${event.data.orderRecord.swapTokenOutBeforeBalance}], 
                    //     afterBalance[${event.data.afterBalance}],
                    //     receiver[${event.data.orderRecord.receiver}],
                    //     toChain[${event.data.orderRecord.toChainId}],
                    //     fromChainId[${event.data.orderRecord.fromChainId}]
                    //     `
                    // );
                }
                begin = signs[index].signature;
            }
        }
    });
}
