import { readFileSync, writeFileSync } from 'fs';

export const env = {
    command: process.env.COMMAND,
    debug: process.env.DEBUG === 'true',
    monorepo: process.env.MONOREPO,
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
