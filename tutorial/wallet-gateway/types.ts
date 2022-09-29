import { RawTransaction } from "@ckb-lumos/lumos";
import { BytesLike } from "@ckb-lumos/codec";

export type SupportedSigningMethods = "eth_personal_sign" | "tron_sign" | "cardano_signData";

export interface GatewayPayload {
  preimage: {
    rawTransaction: RawTransaction;
    hashContentExceptRawTransaction: BytesLike;
  };
  digest: BytesLike;
  signingMethod: SupportedSigningMethods;
}

export interface GatewayEmitter {
  on(event: "DigestValidateFailed", listener: (error: unknown) => void): void;
  on(event: "DigestValidateSuccessful", listener: () => void): void;
  on(event: "Signed", listener: (signature: Uint8Array) => void): void;
}

