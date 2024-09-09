import { delay } from './utils/time'
import { parseConfig } from './config/config'
import { initChain } from './chain/chain'
import { initDb } from './storages/mysql/mysql'
import { Command } from "commander";

const version = (`1.0.0`)
const defCfgPath = "./config.json"

async function main() {
  // step1: flags
  const program = new Command();
  program.name("filter-ts").
    description("CLI to filter solana tracsaction log").
      version(version)
  program.option('-c, --config <>')
  program.parse(process.argv)
  const options = program.opts();
  let configPath = options.config
  if (configPath == "") {
    configPath = defCfgPath
  }
  console.log("Input config path is:", configPath)
  // step2: parse config
  let cfg = parseConfig(configPath)
  console.log("Parse config scuuess")
  // step3: init storage
  initDb(cfg.storages[0].user,cfg.storages[0].psw, cfg.storages[0].db,  cfg.storages[0].host, cfg.storages[0].port)
  console.log("Init db success")
  // step4: init chain
  let chains = initChain(cfg)
  console.log("Init chains success")
  // step5: filter
  for (let index = 0; index < chains.length; index++) {
    const element = chains[index];
    console.log("Chain  ", element.getName(), " start filter")
    element.sync()
  }
  console.log("Chains start filter success")
  // step6: sleep
  for (;;){
    await delay(3000)
  }
}

main()