---
marp: true
class: invert
---

# 使用Lumos构建Nervos DAO交易

---

## Features

- Nervos DAO 是什么
- 使用Lumos构建Nervos DAO交易
- 如何在本地启动一个ckb dev net
- 在Lumos中使用dev net
- 使用dev net 演示DAO整个流程
- DAO收益如何计算

---

## Nervos DAO 是什么


Nervos DAO 是一个智能合约。Nervos DAO 的功能之一就是为 CKByte 持币者提供一种抗稀释的功能。通过将 CKByte 存入 Nervos DAO 中，持有者可以获得一定比例的二级发行。

- Nervos DAO RFC: [link](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md)

- 关于CKB的经济模型和二级发行：[link](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0015-ckb-cryptoeconomics/0015-ckb-cryptoeconomics.md)


---
### Nervos DAO 的存取规则

持有者可以随时将他们的 CKB 存入 Nervos DAO 中。Nervos DAO 是一种定期存款，存在一个最短存款期限，持有者只能在一个完整的存款期之后进行取款。如果持有者在存款期结束时没有取款，这些 CKByte 将自动进入新的存款周期，这样可以尽量减少持币人的操作次数。

Nervos DAO 最短存款期限为 180 个 epoch，一个 epoch 约为 4 小时，因此 180 个 epoch 约合 30 天。

---
#### 简明地理解 Nervos DAO 的存取过程
首先，Nervos DAO 完整的存取一共有三个步骤，包括 1 次存入，2 次取出。

1 次存入很好理解，和将钱存入银行一样，用户可以直接将 CKB 存入 Nervos DAO。

2 次取出可以这样理解，第 1 次取出，就好比您和银行提出了一份申请，表明您需要将存入的金额取出来。

经过银行核对，在您的取出条件满足规定后（在 Nervos DAO 这边就是，从存入的区块高度开始计算，180 个 epoch 的整数倍后您可以取出），您就可以发起第 2 次提取，最终将 CKB 提取到您的钱包内。

理解上，存入 Nervos DAO 就是存了一个为期 30 天的定期，到期之后会自动再为您存一个 30 天的定期。您只有在定期时间到了之后，才能真正取出存入的 CKB。


---
### deposit 交易结构
```
Inputs:
    Normal Cell:
        Capacity: 1000 CKBytes
        Lock: user defined
Outputs:
    DAO deposit Cell:
        Capacity: 1000 CKBytes
        Lock: user defined
        Type: DAO 
        Data: 0x0000000000000000
```

---
### withdraw 交易结构
```
Inputs:
    DAO deposit Cell:
        Capacity: 1000 CKBytes
        Lock: user defined
        Type: DAO 
        Data: 0x0000000000000000
Outputs:
    DAO withdrawing Cell:
        Capacity: 1000 CKBytes
        Lock: user defined
        Type: DAO 
        Data: deposit cell block
```
---
### unlock 交易结构
```
Inputs:
    DAO withdrawing Cell:
        Capacity: 1000 CKBytes
        Lock: user defined
        Type: DAO 
        Data: deposit cell block
Outputs:
    Normal Cell:
        Capacity: 1000 + DAO issue CKBytes
        Lock: user defined
```
---


## 使用Lumos构建Nervos DAO交易

---

### First: Setup Lumos

```ts
import { config, Indexer, RPC } from "@ckb-lumos/lumos";

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

config.initializeConfig(config.predefined.AGGRON4);
```
---

### Build Deposit Transaction

Lumos提供了`commons`模块可以快速构建一些常见的交易

```ts
export const deposit = async (fromAddress: string, privKey: string) => {
  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

  txSkeleton = await commons.dao.deposit(
    txSkeleton,
    fromAddress,
    fromAddress,
    BigInt(1000 * 10 ** 8),
  );

  // pey fee
  txSkeleton = await commons.common.payFeeByFeeRate(
    txSkeleton,
    [fromAddress],
    1000,
  );

  // 签名
  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const Sig = hd.key.signRecoverable(message!, privKey);
  const tx = sealTransaction(txSkeleton, [Sig]);

  // 发送交易
  const hash = await rpc.sendTransaction(tx, "passthrough");
  return hash;
}
```
---
### Build Withdraw Transtion

```ts
export const withdraw = async (depositOutpoint: OutPoint, fromAddress: string, privKey: string) => {
  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

  const depositCell = await getCellByOutPoint(depositOutpoint);

  txSkeleton = await commons.dao.withdraw(
    txSkeleton,
    depositCell,
    fromAddress
  );

  txSkeleton = await commons.common.payFeeByFeeRate(
    txSkeleton,
    [fromAddress],
    1000,
  );

  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const Sig = hd.key.signRecoverable(message!, privKey);
  const tx = sealTransaction(txSkeleton, [Sig]);

  const hash = await rpc.sendTransaction(tx, "passthrough");
  return hash;
}
```
---
### Build Unlock Transtion

``` ts
export const unlock = async (
  depositOutpoint: OutPoint,
  withdrawOutpoint: OutPoint,
  fromAddress: string,
  privKey: string,
) => {
  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

  const depositCell = await getCellByOutPoint(depositOutpoint);
  const withdrawCell = await getCellByOutPoint(withdrawOutpoint);

  txSkeleton = await commons.dao.unlock(
    txSkeleton,
    depositCell,
    withdrawCell,
    fromAddress,
    fromAddress,
  );

  txSkeleton = await commons.common.payFeeByFeeRate(
    txSkeleton,
    [fromAddress],
    1000,
  );

  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const Sig = hd.key.signRecoverable(message!, privKey);
  const tx = sealTransaction(txSkeleton, [Sig]);

  const hash = await rpc.sendTransaction(tx, "passthrough");
  return hash;
}
```

---
## 如何在本地启动ckb dev net

我们使用docker来启动一个本地的测试网，ckb提供了一套docker镜像，大多时候我们只需要稍作配置就可以使用
[ckb docker hub](https://hub.docker.com/r/nervos/ckb)

关于ckb如何配置并不是本章的叙述重点，所以只会讲到本章需要用的一小部分。[详细文档](https://github.com/nervosnetwork/ckb/blob/develop/docs/configure.md)

--- 

一个已经写了一些配置的repo：[https://github.com/homura/ckb-dev](https://github.com/homura/ckb-dev)

1. `git clone https://github.com/homura/ckb-dev`
2. `cd ckb-dev/devnet`
3. `docker-compose up`

---
### 修改ckb dev net的配置

ckb-dev repo 文件结构
```
├── README.md
└── devnet
    ├── README.md
    ├── ckb
    │   ├── Dockerfile
    │   ├── ckb-miner.toml
    │   ├── dev.toml
    │   └── entrypoint.sh
    └── docker-compose.yml
```

其中 `devnet/ckb/dev.toml` 和 `devnet/ckb/ckb-miner.toml` 就是放置大部分配置的文件

---
让我们修改一下`dev.toml`中的`epoch_duration_target`来快速跳过epoch，方便我们测试Nervos DAO
![dev.toml](https://user-images.githubusercontent.com/22258327/191631002-32347137-9119-45fd-b806-68ce4f1029d8.png)

---

## 在Lumos中使用dev net

通过`docker-compose.yml`文件，我们可以看到`ckb`和`ckb-indexer`两个服务分别映射出来8114和8116这两个端口

![docker-compose.yml](https://user-images.githubusercontent.com/22258327/191631247-01fe23ea-6675-4bfd-b5a6-d3838d751b3b.png)

---
根据`docker-compose.yml`中获取的端口配置RPC和INDEXER

```ts
const CKB_RPC_URL = "http://127.0.0.1:8114/rpc";
const CKB_INDEXER_URL = "http://127.0.0.1:8116";

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);
```

---
### 设置config

在使用测试网时,我们通常会使用`config.predefined.AGGRON4`来初始化config，但是本地的ckb开发网络和测试网设置不同，需要我们手动去寻找一些配置

通过`dev.toml`的`genesis.system_cells`配置中我们能看到创世块中有一些初始的script刚好是我们需要的

![genesis.system_cells](https://user-images.githubusercontent.com/22258327/191631596-28f3e8e2-0f69-42ce-b2fe-6d760ab8664a.png)

---

首先我们通过rpc获取到创世快，也就是number为0x0的块，可以看到这个块里面包含了大量的合约，然后我们把这些合约取出来计算一下typehash后生成scriptConfig来初始化lumos


```ts
export const loadDepsFromGenesisBlock = async (): Promise<
  Record<string, config.ScriptConfig>
> => {
  const genesisBlock = await rpc.getBlockByNumber("0x0");

  const secp256k1DepTxHash = genesisBlock.transactions[1].hash;
  const secp256k1TypeScript = genesisBlock.transactions[0].outputs[1].type;
  const secp256k1TypeHash = utils.computeScriptHash(secp256k1TypeScript!);

  const daoDepTxHash = genesisBlock.transactions[0].hash;
  const daoTypeScript = genesisBlock.transactions[0].outputs[2].type;
  const daoTypeHash = utils.computeScriptHash(daoTypeScript!);

  return {
    SECP256K1_BLAKE160: {
      HASH_TYPE: "type",
      CODE_HASH: secp256k1TypeHash,
      TX_HASH: secp256k1DepTxHash!,
      INDEX: "0x0",
      DEP_TYPE: "depGroup",
    },
    DAO: {
      HASH_TYPE: "type",
      CODE_HASH: daoTypeHash,
      TX_HASH: daoDepTxHash!,
      INDEX: "0x2",
      DEP_TYPE: "code",
    },
  };
};


const loadConfig = async () => {
  const initializeConfig = await loadDepsFromGenesisBlock();

  const CONFIG = config.createConfig({
    PREFIX: "ckt",
    SCRIPTS: {
      ...config.predefined.AGGRON4.SCRIPTS,
      ...initializeConfig,
    },
  });

  config.initializeConfig(CONFIG);
};
```
---
### 如何在dev net中获取一些ckb

dev net不像测试网一样有一个方便的水龙头可以直接获取CKB。

但是在`dev.toml`配置文件中有一项`genesis.issued_cells`配置可以生成一些初始的账户, 我们可以直接使用这些账户

---

## 使用dev net 演示DAO整个流程

让我们合并一下之前写的这些代码后运行一下

---
### DAO的利率是如何计算的

[Nervos DAO 页面](https://explorer.nervos.org/nervosdao)可以查看正式网络的利率

举例：此时，您打算存 100,000 CKB 到 Nervos DAO 中，存入 1 个周期（30 天），那么预计获得多少收益呢？

估算：100000 * 3.55 % / 12 = 295.8 CKB

根据当前预计年化收益率为 3.55 %，您存 100,000 CKB 到 Nervos DAO 中，存 1 个完整周期，那么您预计可以获得 295.8 CKB。

因为存在手续费和一些其他原因，实际收益率会略低一点点。

---
#### tips 1: 切勿单次存入金额过低

大家可能都知道Cell本身是需要占用一定的capacity的，比如一个cell最小也需要有61个ckb,这样才能承担起cell本身的大小。

对于一个Nervos DAO的cell来说，本身大小需要占用102个CKB

假设当我们往Nervos DAO中存入1000个CKB时，实际能获得收益的是 1000 - 102 = 898个CKB，而不是1000个。

所以为了降低Cell本身占用的CKB，单次应该尽可能多的存入CKB
---
### tips 2: 发起第一步提现请求，应尽量靠近定期时限
我们知道，存入 Nervos DAO 只需一步，而从 Nervos DAO 中取出则需要两步。

 - 第一步提现交易是将 Nervos DAO 存款单转换为 Nervos DAO 取款单。
 - 第二步提现交易是从 Nervos DAO 取款单中提取代币。

Nervos中实际利息计算的周期是在发起第一步提现后结束的。

```
举例: 假设你在 Epoch = 100 时，正式将一笔 CKB 存入 Nervos DAO，利息计算正式开始；

你在 Epoch = 105 时，进行第一步提现交易，利息计算随即截止，你只获得了 5 个 Epoch 的利息。

此时你需要等待 Epoch > 280（100 + 180） 时，才能正式发送第二步提现交易，最终将本金利息完成取出。
```

---
```
举例 2：假设你在 Epoch = 100 时，正式将一笔 CKB 存入 Nervos DAO，利息计算正式开始；

你在 Epoch = 278 时，进行第一步提现交易，利息计算随即截止，那么你将获得 178 个 Epoch 的利息。

此时你需要等待 Epoch > 280（100 + 180） 时，才能正式发送第二步提现交易，最终将本金利息完成取出。

但是你需要注意，如果你是在 Epoch = 281 的时候，进行第一步提现交易，那么你需要在 Epoch > 460 (100 + 180*2) 时，才能发起第二步提现交易，正式将本金和利息取出。此时你只能获得 Epoch 100 ~ 181 的利息。
```

所以，为了收益的最大化，建议您发起的第一步提现交易，应该尽量靠近定期时限。
---
## 总结

本次分享介绍了关于Nervos DAO的一些知识; 使用Lumos构建了Nervos DAO相关的几笔交易; 启动了一个本地开发网络,快速的跳过epoch; 并且在最后我们测试了这些代码，成功的从DAO中获取了一笔收益

---

### 感谢大家的参与
---