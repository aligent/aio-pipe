#!/bin/bash
#set -x

chown -R node:node /app

npx ts-node pipe/entrypoint.ts