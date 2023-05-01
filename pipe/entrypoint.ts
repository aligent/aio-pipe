import { runCLICommand } from "./cmd"
import { generateAuthToken } from "./jwt"
import { env } from "./env"

let commandStr: string[] = []

switch (env.command ? env.command.toLowerCase() : '') {
  case '':
    throw new Error("⛔ No aio command specified");
  case 'build':
    commandStr.push("aio app build");
    break;
  case 'deploy':
    generateAuthToken();
    commandStr.push('aio app deploy --no-build');
    break;
  case 'auth':
    generateAuthToken();
    break;
}

if (env.debug) console.log(`ℹ️ Running pipeline in ${env.command} mode`);

runCLICommand(commandStr)
    .then(() => {
        console.log("🕺 Pipeline run was successful")
    })
    .catch(() =>{
        throw new Error("💀 Pipeline run failed")
    })
