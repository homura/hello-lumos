import { signDigest } from "./gateway";
import { ALICE_ADDRESS, BOB_ADDRESS, indexer, rpc } from "../01-initialize";
import { commons, helpers } from "@ckb-lumos/lumos";
import { createTransactionFromSkeleton } from "@ckb-lumos/helpers";
import { createP2PKHMessageGroup } from "@ckb-lumos/common-scripts";
import { concat, hexify } from "@ckb-lumos/codec/lib/bytes";

async function main() {
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
  txSkeleton = await commons.common.transfer(txSkeleton, [ALICE_ADDRESS], BOB_ADDRESS, 100e8);

  // https://github.com/nervosnetwork/ckb/blob/develop/util/app-config/src/legacy/tx_pool.rs#L9
  // const DEFAULT_MIN_FEE_RATE: FeeRate = FeeRate::from_u64(1000);
  txSkeleton = await commons.common.payFeeByFeeRate(txSkeleton, [ALICE_ADDRESS], 1000 /*fee_rate*/);

  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);

  const hashContentExceptRawTransaction = ((): Uint8Array => {
    let result: Uint8Array = Uint8Array.from([]);
    let skippedTxHash = false;
    createP2PKHMessageGroup(txSkeleton, [txSkeleton.get("inputs").get(0)!.cellOutput.lock], {
      hasher: {
        digest() {
          return Uint8Array.from([]);
        },
        update(message: Uint8Array) {
          // the first message is txHash, we should skip it, the update is collecting `hashContentExceptRawTransaction`
          if (!skippedTxHash) {
            skippedTxHash = true;
            return;
          }
          result = concat(result, message);
        },
      },
    });

    return result;
  })();

  const emitter = signDigest({
    digest: txSkeleton.get("signingEntries").get(0)!.message,
    signingMethod: "eth_personal_sign",
    preimage: {
      rawTransaction: createTransactionFromSkeleton(txSkeleton),
      hashContentExceptRawTransaction,
    },
  });

  emitter.on("DigestValidateFailed", console.log);

  emitter.on("Signed", async (signature) => {
    const signedTx = helpers.sealTransaction(txSkeleton, [hexify(signature)]);
    const txHash = await rpc.sendTransaction(signedTx);
    console.log(`Go to explorer to check the sent transaction https://pudge.explorer.nervos.org/transaction/${txHash}`);
  });
}

main();
