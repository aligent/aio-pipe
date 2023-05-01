import * as cp from 'child_process'
import { readdirSync } from 'fs'

const { context, getToken } = require('@adobe/aio-lib-ims')

const DEBUG = process.env.DEBUG === 'true'
const MONOREPO = process.env.MONOREPO
const command = process.env.COMMAND

if (!command || command === '')
    throw new Error("⛔ No aio command specified")

let commandStr: string[] = []

const getDirectories = (source: string) =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

// Wrap spawn in a promise
function asyncSpawn(command: string, args?: ReadonlyArray<string>, options?: cp.SpawnOptionsWithoutStdio): Promise<number | null> {
    return new Promise(function (resolve, reject) {
        const process = cp.spawn(command, args, options);
        if (DEBUG) console.log(`ℹ️ Executing command: ${command} ${args?.join(' ')}`);

        process.stdout.on('data', (data) => {
            console.log(data.toString());
        });

        process.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        process.on('exit', function (code) {
            if (code !== 0) reject(code);
            resolve(code);
        });

        process.on('error', function (err) {
            reject(err);
        });
    });
}

function nodeUserAsyncSpawn(command: string, args?: ReadonlyArray<string>, workDir?: string): Promise<number | null> {
    return asyncSpawn('sudo', ['-u', 'node', command, ...(args ? args : [])], { cwd: workDir });
}

interface Command {
    command: string,
    args: ReadonlyArray<string>
}

function splitCommandAndArgs(command: string): Command {
    // Split the command string at all white spaces excluding white spaces wrapped with single quotes
    const cmd = command.split(/\s(?=(?:[^']*'[^']*')*[^']*$)/g)
    return {
        command: cmd.shift() as string,
        args: cmd
    }
}

function runCommandString(command: string, workDir?: string): Promise<number | null> {
    const cmd = splitCommandAndArgs(command);
    return nodeUserAsyncSpawn(cmd.command, cmd.args, workDir);
}


if (command.toLowerCase() === 'build') {
    commandStr.push("aio app build")
}
else if (command.toLowerCase() === 'deploy') {
    // TODO: try and get this into a similar format to the below file
    // to see if that authentication method works 

//     ```js
// {
//   ims: {
//     contexts: {
//       sample_jwt: {
//         client_id: "<jwt-clientid>",
//         client_secret: "XXX",
//         technical_account_id: "<guid>@techacct.adobe.com",
//         meta_scopes: [
//           "ent_dataservices_sdk"
//         ],
//         ims_org_id: "<org-guid>@AdobeOrg",
//         private_key: "XXX"
//       },
//       sample_oauth2: {
//         redirect_uri: "https://callback.example.com",
//         client_id: "<oauth2-clientid>",
//         client_secret: "XXX",
//         scope: "openid AdobeID"
//       },
//     }
//   }
// }
// ```


// may just try using this library? @adobe/aio-lib-ims
    generateAuthToken();
    commandStr.push('aio app deploy --no-build')
}
else if (command.toLowerCase() === 'auth') {
    generateAuthToken()
}

if (DEBUG) console.log(`ℹ️ Running pipeline in ${command} mode`);
runCLICommand(commandStr)
    .then(() => {
        console.log("🕺 Pipeline run was successful")
    })
    .catch(() =>{
        throw new Error("💀 Pipeline run failed")
    })


async function runCLICommand(commandStr: Array<string>) {
    const workDirs = ((): string[] => {
        if (MONOREPO)
            return getDirectories(`/app/${MONOREPO}`).map(dir => `/app/${MONOREPO}/${dir}`)

        return ['/app']
    })();

    // Always turn telemetry off otherwise app builder prompts for input
    await runCommandString("aio telemetry off")

    // loop through each directory in the mono repo and run the selected command 
    for (const workDir of workDirs) {
        console.log(`▶️ Running aio commands in ${workDir}`)
        for (const cmd of commandStr) {
            await runCommandString(cmd, workDir)
        }
    }
}

function generateAuthToken() {
    //generate jwt auth
    const key = process.env.KEY || ''
    const scopes = process.env.SCOPES || 'ent_eventpublisher_sdk'
    const clientId = process.env.CLIENT_ID
    const clientSecret = process.env.CLIENT_SECRET
    const techAccId = process.env.TECHNICAL_ACCOUNT_ID
    const imsOrgId = process.env.IMS_ORG_ID

    const imsConfig = {
        client_id: clientId,
        client_secret: clientSecret,
        technical_account_id: techAccId,
        ims_org_id: imsOrgId,
        private_key: key.toString(),
        meta_scopes: [
            scopes
        ]
    }

    getJwtToken(imsConfig)
        .then(async res => {
            if (DEBUG) console.log('ℹ️ Generated auth token successfully')
            if (DEBUG) console.log(`ℹ️ CLI_ACCESS_TOKEN=${res}`)
        })
}

async function getJwtToken(imsConfig) {
    await context.set('genjwt', imsConfig, true)
    await context.setCurrent('genjwt')
    const token = await getToken('genjwt')
    return token
}

