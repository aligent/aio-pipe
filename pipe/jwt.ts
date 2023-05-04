const { context, getToken } = require('@adobe/aio-lib-ims')
import { env, getEnv } from "./env"

interface imsConfig {
    client_id: string,
    client_secret: string,
    technical_account_id: string,
    ims_org_id: string,
    private_key: string,
    meta_scopes: string[]
}

export interface AuthToken {
    token: string,
    expiry: string
}

export async function getAuthToken(workDir: string): Promise<AuthToken> {
    return getExistingAuthToken(workDir) || await generateAuthToken()
}

export async function generateAuthToken(): Promise<AuthToken> {
    const key = process.env.KEY || ''
    const scopes = process.env.SCOPES || 'ent_eventpublisher_sdk'
    const clientId = process.env.CLIENT_ID!
    const clientSecret = process.env.CLIENT_SECRET!
    const techAccId = process.env.TECHNICAL_ACCOUNT_ID!
    const imsOrgId = process.env.IMS_ORG_ID!

    const imsConfig: imsConfig = {
        client_id: clientId,
        client_secret: clientSecret,
        technical_account_id: techAccId,
        ims_org_id: imsOrgId,
        private_key: key.toString(),
        meta_scopes: [
            scopes
        ]
    }

    return getJwtToken(imsConfig)
        .then(async token => {
            console.log('ℹ️ Generated auth token successfully')
            if (env.debug) console.log(`ℹ️ CLI_ACCESS_TOKEN=${token}`)

            const expiry = Date.now() + 30 * 60 * 1000
            return {
                token: token,
                expiry: expiry.toString()
            }
        })
}

async function getJwtToken(imsConfig: imsConfig): Promise<string> {
    await context.set('genjwt', imsConfig, true)
    await context.setCurrent('genjwt')
    const token = await getToken('genjwt')
    return token
}

function isValidAuthToken(authToken: unknown): authToken is AuthToken {
    const token = (authToken as AuthToken).token
    const expiry = (authToken as AuthToken).expiry

    const expiryInt = parseInt(expiry)

    if (isNaN(expiryInt))
        return false

    return token !== undefined && expiryInt > new Date().getTime()
}

export function getExistingAuthToken(workDir: string): AuthToken | undefined {
    const token = getEnv('AIO_IMS_CONTEXTS_CLI_ACCESS__TOKEN_TOKEN', workDir)
    const expiry = getEnv('AIO_IMS_CONTEXTS_CLI_ACCESS__TOKEN_EXPIRY', workDir)

    const authToken = { token, expiry }

    if (isValidAuthToken(authToken)) {
        if (env.debug) console.log(`ℹ️ Got existing auth token values`);
        
        return authToken
    }

    if (env.debug) console.log(`ℹ️ Existing auth token was not found or has expired`);
    return
}
