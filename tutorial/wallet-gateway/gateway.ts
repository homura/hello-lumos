import { GatewayEmitter, GatewayPayload } from "./types";
import { ckbHash } from "@ckb-lumos/base/lib/utils";
import { blockchain } from "@ckb-lumos/base";
import { bytify, concat, equal } from "@ckb-lumos/codec/lib/bytes";
import { ALICE_PRIVATE_KEY } from "../01-initialize";
import { hd } from "@ckb-lumos/lumos";
import { createInterface } from "readline";

export function signDigest(payload: GatewayPayload): GatewayEmitter {
  let onDigestValidateSuccessful: undefined | (() => void);
  let onDigestValidateFailed: undefined | ((err: unknown) => void);
  let onSigned: undefined | ((signature: Uint8Array) => void);

  setImmediate(() => {
    const txHash = ckbHash(blockchain.RawTransaction.pack(payload.preimage.rawTransaction));
    const digest = ckbHash(concat(txHash, payload.preimage.hashContentExceptRawTransaction));
    const isValidatedDigest = equal(digest, payload.digest);

    if (!isValidatedDigest) {
      onDigestValidateFailed?.("digest verify failed");
      return;
    }

    onDigestValidateSuccessful?.();

    const rl = createInterface({ input: process.stdin, output: process.stdout });

    rl.question(
      `
${JSON.stringify(payload.preimage.rawTransaction, null, 2)}
approve for signing ${digest}?(Y/N)
    `,
      (yesOrNo) => {
        if (yesOrNo === "y" || yesOrNo === "Y") {
          onSigned?.(bytify(hd.key.signRecoverable(digest, ALICE_PRIVATE_KEY)));
        }
        rl.close();
      }
    );
  });

  return {
    on(event: any, listener: any) {
      if (event === "DigestValidateSuccessful") onDigestValidateSuccessful = listener;
      else if (event === "DigestValidateFailed") onDigestValidateFailed = listener;
      else if (event === "Signed") onSigned = listener;
    },
  } as GatewayEmitter;
}
