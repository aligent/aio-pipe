# Aligent Adobe App Builder Deploy Pipe

This pipe is used to relay commits to Magento Cloud to trigger deployments.

## YAML Definition

Add the following your `bitbucket-pipelines.yml` file:

```yaml
      - step:
          name: "Git commit relay"
          script:
            - pipe: docker://aligent/magento-cloud-deploy-pipe:latest
              variables:
                MAGENTO_CLOUD_REMOTE: "user@git-remote.git"
```
## Variables

| Variable              | Usage                                                       |
| --------------------- | ----------------------------------------------------------- |
| MAGENTO_CLOUD_REMOTE      | The git remote where commits will be relayed|
| NR_APP_ID      | (Optional) The NewRelic App ID the deployment marker will be created in|
| NR_USER_KEY      | (Optional) The NewRelic User Key for API Calls |
| NR_ALERT_MUTING_RULE_ID      | (Optional) The NewRelic Alert Mute Rule ID used for suppressing alerts during deployment|
| NR_ACCOUNT_ID      | (Optional) The NewRelic Account ID that the deployment will suppress the alerts|
| DEBUG                 | (Optional) Turn on extra debug information. Default: `false`. |


## Development

Commits published to the `main` branch  will trigger an automated build for the `latest` tag in DockerHub

## See also

- https://github.com/adobe/aio-cli
- https://github.com/adobe/aio-apps-action
