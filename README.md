
# Colibri Group Github webhook listener

This repo cotanins code to run a GitHub webhook listener for use with GitHub <-> Jenkins integration.  The code for this webhook is forked from the Serverless Examples repo / [aws-node-github-webhook-listener](https://github.com/serverless/examples/tree/master/aws-node-github-webhook-listener).  

## Use Case

* GitHub <-> Jenkins integration 

## How it works

```
┌───────────────┐               ┌───────────┐
│               │               │           │
│  GitHub repo  │               │  GitHub   │
│   activity    │────Trigger───▶│  Webhook  │
│               │               │           │
└───────────────┘               └───────────┘
                                      │
                     ┌────POST────────┘
                     │
          ┌──────────▼─────────┐
          │ ┌────────────────┐ │
          │ │  API Gateway   │ │
          │ │    Endpoint    │ │
          │ └────────────────┘ │
          └─────────┬──────────┘
                    │
                    │
         ┌──────────▼──────────┐
         │ ┌────────────────┐  │
         │ │                │  │
         │ │     Lambda     │  │
         │ │    Function    │  │
         │ │                │  │
         │ └────────────────┘  │
         └─────────────────────┘
                    │
                    │
                    ▼
         ┌────────────────────┐
         │                    │
         │   Run Jenkins Job  │
         │                    │
         └────────────────────┘
```

## Setup

1. Deploy the service (if not presently deployed).  The GitHub Webhook obtains Jenkins credentials and the GITHUB_WEBHOOK_SERCRET using AWS Secrets Manager - there is no need to specify these manually.  

    ```yaml
    serverless deploy
    ```

1. Follow the [internal documentation](https://colibrigroup.atlassian.net/wiki/spaces/ENG/pages/180518931/GitHub+%3C-%3E+Jenkins+Webhook) for setting up a repository with the webhook.  