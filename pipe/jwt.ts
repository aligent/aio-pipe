const { context, getToken } = require('@adobe/aio-lib-ims')
import { env } from "./env"

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
export function generateAuthToken() {
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
            if (env.debug) console.log('ℹ️ Generated auth token successfully')
            if (env.debug) console.log(`ℹ️ CLI_ACCESS_TOKEN=${res}`)
        })
}

async function getJwtToken(imsConfig) {
    await context.set('genjwt', imsConfig, true)
    await context.setCurrent('genjwt')
    const token = await getToken('genjwt')
    return token
}
