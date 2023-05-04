import { runCLICommand } from "./cmd"
import { env } from "./env"

let commandStr: string[] = []

switch (env.command ? env.command.toLowerCase() : '') {
  case '':
    throw new Error("⛔ No aio command specified");
  case 'build':
    commandStr.push("aio app build");
    break;
  case 'deploy':
    commandStr.push('aio app deploy --no-build');
    break;
  case 'auth':
    // Authentication happens by default
    break;
}

if (env.debug) console.log(`ℹ️ Running pipeline in ${env.command} mode`);

runCLICommand(commandStr)
    .then(() => {
        console.log(`🕺 ${env.command} was successful`)
    })
    .catch(() =>{
        throw new Error(`💀 ${env.command} failed`)
    })
