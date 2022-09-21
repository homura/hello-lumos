import { commons, hd, helpers } from "@ckb-lumos/lumos";
import { ALICE_ADDRESS, ALICE_PRIVATE_KEY, BOB_ADDRESS, indexer, rpc } from "./01-initialize";

// tips: debug to check the txSkeleton
// tips: we can use txSkeleton.toJSON() / txSkeleton.toJSON().outputs.toJSON() to pretty output on console
async function main() {
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
  txSkeleton = await commons.common.transfer(txSkeleton, [ALICE_ADDRESS], BOB_ADDRESS, 100e8);

  // https://github.com/nervosnetwork/ckb/blob/develop/util/app-config/src/legacy/tx_pool.rs#L9
  // const DEFAULT_MIN_FEE_RATE: FeeRate = FeeRate::from_u64(1000);
  txSkeleton = await commons.common.payFeeByFeeRate(txSkeleton, [ALICE_ADDRESS], 1000 /*fee_rate*/);

  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);

  const signatures = txSkeleton
    .get("signingEntries")
    .map((entry) => hd.key.signRecoverable(entry.message, ALICE_PRIVATE_KEY))
    .toArray();

  const signedTx = helpers.sealTransaction(txSkeleton, signatures);
  const txHash = await rpc.sendTransaction(signedTx);
  console.log(`Go to explorer to check the sent transaction https://pudge.explorer.nervos.org/transaction/${txHash}`);
}

main();
