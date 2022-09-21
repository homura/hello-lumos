import { commons, hd, helpers } from "@ckb-lumos/lumos";
import { ALICE_ADDRESS, ALICE_PRIVATE_KEY, indexer, rpc } from "./01-initialize";

// https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0025-simple-udt/0025-simple-udt.md
async function main() {
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });

  txSkeleton = await commons.sudt.issueToken(txSkeleton, ALICE_ADDRESS, 1);

  txSkeleton = await commons.common.payFeeByFeeRate(txSkeleton, [ALICE_ADDRESS], 1000);

  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);

  const signatures = txSkeleton
    .get("signingEntries")
    .map((entry) => hd.key.signRecoverable(entry.message, ALICE_PRIVATE_KEY))
    .toArray();

  const signedTx = helpers.sealTransaction(txSkeleton, signatures);
  const txHash = await rpc.sendTransaction(signedTx);
  console.log(`Go to explorer to check the sent transaction https://pudge.explorer.nervos.org/transaction/${txHash}`);
  console.log(`And we can back to ./03-check-alice-cells.ts to check Alice's live cells`);
}

main();
