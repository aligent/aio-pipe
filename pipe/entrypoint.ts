import { runCLICommand } from "./cmd"
import { generateAuthToken } from "./jwt"
import { env } from "./env"

if (!env.command|| env.command === '')
    throw new Error("⛔ No aio command specified")

let commandStr: string[] = []


if (env.command.toLowerCase() === 'build') {
    commandStr.push("aio app build")
}
else if (env.command.toLowerCase() === 'deploy') {
    generateAuthToken();
    commandStr.push('aio app deploy --no-build')
}
else if (env.command.toLowerCase() === 'auth') {
    generateAuthToken()
}

if (env.debug) console.log(`ℹ️ Running pipeline in ${env.command} mode`);
runCLICommand(commandStr)
    .then(() => {
        console.log("🕺 Pipeline run was successful")
    })
    .catch(() =>{
        throw new Error("💀 Pipeline run failed")
    })
