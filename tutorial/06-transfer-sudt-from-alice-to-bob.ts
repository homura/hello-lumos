import { commons, hd, helpers, utils } from "@ckb-lumos/lumos";
import { ALICE_ADDRESS, ALICE_LOCK_SCRIPT, ALICE_PRIVATE_KEY, BOB_ADDRESS, indexer, rpc } from "./01-initialize";

async function main() {
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });

  txSkeleton = await commons.sudt.transfer(
    txSkeleton,
    [ALICE_ADDRESS],
    utils.computeScriptHash(ALICE_LOCK_SCRIPT),
    BOB_ADDRESS,
    1
  );

  txSkeleton = await commons.common.payFeeByFeeRate(txSkeleton, [ALICE_ADDRESS], 1000);

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
