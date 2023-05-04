import * as cp from 'child_process'
import { readdirSync } from 'fs'
import { env, writeEnv } from './env';
import { getAuthToken } from './jwt';

// Wrap spawn in a promise
function asyncSpawn(command: string, args?: ReadonlyArray<string>, options?: cp.SpawnOptionsWithoutStdio): Promise<number | null> {
    return new Promise(function (resolve, reject) {
        const process = cp.spawn(command, args, options);
        if (env.debug) console.log(`ℹ️ Executing command: ${command} ${args?.join(' ')} with options: ${JSON.stringify(options)}`);

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
    return asyncSpawn(cmd.command, cmd.args, { cwd: workDir });
}

const getDirectories = (source: string) =>
    readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)

export async function runCLICommand(commandStr: Array<string>) {
    const workDirs = ((): string[] => {
        if (env.monorepo)
            return getDirectories(`/app/${env.monorepo}`).map(dir => `/app/${env.monorepo}/${dir}`)

        return ['/app']
    })();

    // Always turn telemetry off otherwise app builder prompts for input
    await runCommandString("aio telemetry off")

    // loop through each directory in the mono repo and run the selected command 
    for (const workDir of workDirs) {
        console.log(`▶️ Running aio commands in ${workDir}`)

        // Authenticate
        const token = await getAuthToken(workDir);
        writeEnv('AIO_IMS_CONTEXTS_CLI_ACCESS__TOKEN_TOKEN', token.token, workDir)
        writeEnv('AIO_IMS_CONTEXTS_CLI_ACCESS__TOKEN_EXPIRY', token.expiry, workDir)
        
        // TODO: get environment variables for each service
        // runtime_auth and runtime_namespace

        for (const cmd of commandStr) {
            await runCommandString(cmd, workDir)
        }
    }
}
