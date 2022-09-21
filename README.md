# Hello Lumos

This repo is used to show how to use
[Lumos@c39f082](https://github.com/ckb-js/lumos/tree/c39f082ac8d20ba276b5f5a89681864018ebd124) to interact with CKB.

> There will be some sample code in this tutorial. These sample codes may be written in TypeScript. We will directly use
> the Lumos environment to simplify the development environment.

## Pre-requirement

- VSCode
- NodeJS 12+
- Yarn 1.x
- Learned about
  - [Cell Model](https://docs.nervos.org/docs/basics/concepts/cell-model)
  - [Transaction Structure](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0022-transaction-structure/0022-transaction-structure.md)
  - [Indexer](https://github.com/nervosnetwork/ckb-indexer)

## Setup

```sh
# build this project
git clone --recurse-submodules https://github.com/homura/hello-lumos.git
yarn

# build lumos
cd lumos
yarn
yarn build
yarn build-release
```

## Tutorial(via Testnet)

### Slide

```shell
npm run preview:tutorial
```

### Code

1. Open this project in VSCode
2. go to [/tutorial/01-initialize.ts](tutorial/01-initialize.ts)
3. `start debugging`(or press `f5`)

## DAO(via Devnet)

## Q&A

### Is there a public CKB testnet node to access?

- RPC: <https://testnet.ckb.dev/rcp>
- Indexer: <https://testnet.ckb.dev/indexer>

```sh
curl --request POST 'https://testnet.ckb.dev/rcp' \
--header 'Content-Type: application/json' \
--data-raw '{
  "id": 42,
  "jsonrpc": "2.0",
  "method": "get_tip_block_number"
}'
```

### How to interactive public node via proxy?

`HTTP(S)_PROXY` env variable does not work in NodeJS, we can
use [global-agent](https://github.comgajusglobal-agent) as an alternative

```sh
yarn add global-agent -D
export GLOBAL_AGENT_HTTP_PROXY=http://127.0.0.1:7890
node -r 'global-agent/bootstrap' /path/to/my/script.js
```

or add the snippet in the program entry

```js
process.env.GLOBAL_AGENT_HTTP_PROXY = "http://127.0.0.1:7890";
require("global-agent/bootstrap");
```
