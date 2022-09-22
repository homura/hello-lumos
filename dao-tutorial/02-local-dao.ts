import {
  config,
  Indexer,
  RPC,
  hd,
  commons,
  OutPoint,
  Cell,
  utils,
  since,
  BI,
} from "@ckb-lumos/lumos";
import {
  TransactionSkeleton,
  encodeToAddress,
  sealTransaction,
} from "@ckb-lumos/helpers";

// ckt
const CKB_RPC_URL = "http://127.0.0.1:8114/rpc";
const CKB_INDEXER_URL = "http://127.0.0.1:8116";

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

function asyncSleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitTransactionCommitted(txHash: string) {
  const tx = await rpc.getTransaction(txHash);
  if (!tx) {
    throw new Error(`not found tx: ${txHash}`);
  }

  let status = tx.txStatus.status;

  while (status !== "committed") {
    await asyncSleep(1000);
    status = (await rpc.getTransaction(txHash)).txStatus.status;
  }
}

async function waitEpochByNumber(epochNumber: number, log: boolean = false) {
  const getCurrentepoch = async () =>
    parseInt(await (await rpc.getCurrentEpoch()).number);

  let currentEpoch = await getCurrentepoch();

  while (currentEpoch < epochNumber) {
    await asyncSleep(5 * 1000);
    currentEpoch = await getCurrentepoch();
    if (log) {
      console.log('wait ', epochNumber, ' epoch, current is ', currentEpoch)
    }
  }
}

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
  return CONFIG;
};

export const getCellByOutPoint = async (outpoint: OutPoint): Promise<Cell> => {
  const tx = await rpc.getTransaction(outpoint.txHash);
  if (!tx) {
    throw new Error(`not found tx: ${outpoint.txHash}`);
  }

  const block = await rpc.getBlock(tx.txStatus.blockHash!);
  return {
    cellOutput: tx.transaction.outputs[0],
    data: tx.transaction.outputsData[0],
    outPoint: outpoint,
    blockHash: tx.txStatus.blockHash,
    blockNumber: block!.header.number,
  };
};

const getEpochByTransaction = async (txHash: string): Promise<number> => {
  const tx = await rpc.getTransaction(txHash);
  if (!tx) {
    throw new Error(`not found tx: ${txHash}`);
  }

  const block = await rpc.getBlock(tx.txStatus.blockHash!);
  return since.parseEpoch(block.header.epoch).number;
};

async function deposit(fromAddress: string, privKey: string) {
  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

  const toAdress = fromAddress;

  txSkeleton = await commons.dao.deposit(
    txSkeleton,
    fromAddress,
    toAdress,
    BigInt(1000 * 10 ** 8)
  );

  txSkeleton = await commons.common.payFeeByFeeRate(
    txSkeleton,
    [fromAddress],
    BigInt(1 * 10 ** 8)
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

export const withdraw = async (
  depositOutpoint: OutPoint,
  fromAddress: string,
  privKey: string
) => {
  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

  const depositCell = await getCellByOutPoint(depositOutpoint);

  txSkeleton = await commons.dao.withdraw(txSkeleton, depositCell, fromAddress);

  txSkeleton = await commons.common.payFeeByFeeRate(
    txSkeleton,
    [fromAddress],
    1000
  );

  // 签名
  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const Sig = hd.key.signRecoverable(message!, privKey);
  const tx = sealTransaction(txSkeleton, [Sig]);

  // 发布交易
  const hash = await rpc.sendTransaction(tx, "passthrough");
  return hash;
};

export const unlock = async (
  depositOutpoint: OutPoint,
  withdrawOutpoint: OutPoint,
  fromAddress: string,
  privKey: string
) => {
  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

  const depositCell = await getCellByOutPoint(depositOutpoint);
  const withdrawCell = await getCellByOutPoint(withdrawOutpoint);

  txSkeleton = await commons.dao.unlock(
    txSkeleton,
    depositCell,
    withdrawCell,
    fromAddress,
    fromAddress
  );

  txSkeleton = await commons.common.payFeeByFeeRate(
    txSkeleton,
    [fromAddress],
    1000
  );

  // 签名
  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const Sig = hd.key.signRecoverable(message!, privKey);
  const tx = sealTransaction(txSkeleton, [Sig]);

  // 发送
  const hash = await rpc.sendTransaction(tx, "passthrough");
  return hash;
};

const generateSECP256K1Account = (privKey: string) => {
  const pubKey = hd.key.privateToPublic(privKey);
  const args = hd.key.publicKeyToBlake160(pubKey);
  const template = config.getConfig().SCRIPTS["SECP256K1_BLAKE160"]!;
  const lockScript = {
    codeHash: template.CODE_HASH,
    hashType: template.HASH_TYPE,
    args: args,
  };
  const address = encodeToAddress(lockScript);
  return {
    lockScript,
    address,
    pubKey,
    privKey,
  };
};

const bootstrap = async () => {
  await loadConfig();

  // from dev net config file
  const alice = generateSECP256K1Account(
    "0xd6013cd867d286ef84cc300ac6546013837df2b06c9f53c83b4c33c2417f6a07"
  );

  // 抵押ckb
  const depositTx = await deposit(alice.address, alice.privKey);
  const depositOutpoint = { txHash: depositTx, index: "0x0" };
  console.log("depositOutpoint: ", depositOutpoint);

  // 等待交易上链
  await waitTransactionCommitted(depositTx);
  const depositEpoch = await getEpochByTransaction(depositTx);


  // 在发起交易的170个epoch后发起第一步提现
  await waitEpochByNumber(depositEpoch + 170, true);

  const withdrawTx = await withdraw(
    depositOutpoint,
    alice.address,
    alice.privKey
  );
  const withdrawOutpoint = { txHash: withdrawTx, index: "0x0" };
  console.log("withdrawOutpoint: ", withdrawOutpoint);

  // 等待交易上链
  await waitTransactionCommitted(withdrawTx);
  

  // 在发起交易的180个epoch后发起第二步提现(unlock)
  await waitEpochByNumber(depositEpoch + 180);

  const unlockTxHash = await unlock(
    depositOutpoint,
    withdrawOutpoint,
    alice.address,
    alice.privKey
  );

  console.log("unlockTxHash is", unlockTxHash);

  const unlockTx = await rpc.getTransaction(unlockTxHash);
  console.log(
    "unlock ",
    BI.from(unlockTx.transaction.outputs[0].capacity).toNumber() / 10 ** 8,
    " CKB"
  );
};

bootstrap();
