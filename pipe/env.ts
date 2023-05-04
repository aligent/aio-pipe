import { readFileSync, readdirSync, writeFileSync } from 'fs';

interface Runtime {
    auth: string
    namespace: string
}

function getServices(): string[] {
    if (process.env.MONOREPO) {
        const ignoredServices = process.env.IGNORED_SERVICES || ''
        const ignoredServicesArray = ignoredServices.split(',')

        return readdirSync(`/app/${process.env.MONOREPO}`, { withFileTypes: true })
            .filter(dir => dir.isDirectory())
            .map(dir => dir.name)
            .filter(dir => !ignoredServicesArray.includes(dir))
    }

    return []
}

function getRunTimes(): Record<string, Runtime> {
    const services = getServices()

    const workDirs = services.map(service => `/app/${process.env.MONOREPO}/${service}`)

    if (workDirs.length === 0) {
        return {
            default: {
                auth: process.env.AIO_RUNTIME_AUTH || '',
                namespace: process.env.AIO_RUN || ''
            }
        }
    } else {
        return Object.assign({}, ...workDirs.map(dir => {
            const serviceName = dir.split('/').pop()!
            return { 
                [serviceName]: {
                    auth: process.env[`${serviceName.toUpperCase()}_AIO_RUNTIME_AUTH`],
                    namespace: process.env[`${serviceName.toUpperCase()}_AIO_RUNTIME_NAMESPACE`]
                }
            }
        }))
    }
}

interface Env {
    command: string
    debug: boolean
    monorepo: string
    services: string[]
    runtimes: Record<string, Runtime>
}

export const env: Env = {
    command: process.env.COMMAND!,
    debug: process.env.DEBUG === 'true',
    monorepo: process.env.MONOREPO || '',
    services: getServices(),
    runtimes: getRunTimes()
}

function isErrnoException(error: any): error is NodeJS.ErrnoException {
  return typeof error.code === 'string';
}

export function writeEnv(key: string, value: string, workDir: string) {
    const filePath = `${workDir}/.env`
    // Set the environment variable
    process.env[key] = value;

    try {
        // Read the content of the .env file
        const content = readFileSync(filePath, 'utf8');

        // Parse the content to a JavaScript object
        const parsedEnv = Object.fromEntries(
            content
                .split('\n')
                .filter(Boolean) // Remove empty lines
                .map((line) => line.split('=').map((part) => part.trim()))
        );

        // Update the desired value
        parsedEnv[key] = value;

        // Convert the object back to a string
        const updatedContent = Object.entries(parsedEnv)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        // Write the updated content back to the .env file
        writeFileSync(filePath, updatedContent);
    } catch (error) {
        if (isErrnoException(error) && error.code === 'ENOENT') {
            // File doesn't exist, create a new one and add the value
            const initialContent = `${key}=${value}\n`;
            writeFileSync(filePath, initialContent);
        } else {
            console.error('An error occurred:', error);
        }
    }
}

export function getEnv(key: string, workDir: string): string | undefined {
    const filePath = `${workDir}/.env`
    try {
        // Read the content of the .env file
        const content = readFileSync(filePath, 'utf8');

        // Parse the content to a JavaScript object
        const parsedEnv = Object.fromEntries(
            content
                .split('\n')
                .filter(Boolean) // Remove empty lines
                .map((line) => line.split('=').map((part) => part.trim()))
        );

        return parsedEnv[key];
    } catch (error) {
        return;
    }
}
