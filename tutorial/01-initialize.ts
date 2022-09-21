import { helpers, config, hd, HexString, Indexer, Script, RPC } from "@ckb-lumos/lumos";
import { generateKeySync } from "crypto";
import { bytes } from "@ckb-lumos/codec";

// initialize with testnet config
config.initializeConfig(config.predefined.AGGRON4);

// RPC to interactive with CKB node, e.g. sendTransaction
export const rpc = new RPC("https://testnet.ckb.dev/rpc");
// A ckb-indexer client for Lumos for collecting the live cells to assemble transaction
export const indexer = new Indexer("https://testnet.ckb.dev/indexer", "https://testnet.ckb.dev/rpc");

// TODO: run main() and replace below code from console output
// ------ generated start ------
export const ALICE_PRIVATE_KEY = "";
export const ALICE_ADDRESS = "";
export const ALICE_LOCK_SCRIPT: Script = {"codeHash":"","hashType":"type","args":""};

export const BOB_PRIVATE_KEY = "";
export const BOB_ADDRESS = "";
export const BOB_LOCK_SCRIPT: Script = {"codeHash":"","hashType":"type","args":""};
// ------ generated end ------

function generateKey(): HexString {
  return bytes.hexify(generateKeySync("hmac", { length: 256 }).export());
}

function main() {
  // avoid re-generate testing key pairs again and again
  if (ALICE_ADDRESS && BOB_ADDRESS) return;

  const alicePrivateKey = generateKey();
  const aliceAddress = helpers.encodeToConfigAddress(
    hd.key.privateKeyToBlake160(alicePrivateKey),
    "SECP256K1_BLAKE160"
  );
  const aliceScript = helpers.parseAddress(aliceAddress);

  const bobPrivateKey = generateKey();
  const bobAddress = helpers.encodeToConfigAddress(hd.key.privateKeyToBlake160(bobPrivateKey), "SECP256K1_BLAKE160");
  const bobScript = helpers.parseAddress(bobAddress);

  console.log(`// ------ generated start ------
export const ALICE_PRIVATE_KEY = "${alicePrivateKey}";
export const ALICE_ADDRESS = "${aliceAddress}";
export const ALICE_LOCK_SCRIPT: Script = ${JSON.stringify(aliceScript)};

export const BOB_PRIVATE_KEY = "${bobPrivateKey}";
export const BOB_ADDRESS = "${bobAddress}";
export const BOB_LOCK_SCRIPT: Script = ${JSON.stringify(bobScript)};
// ------ generated end ------`);
}

// uncomment me to run the method to generate initialization config
main();
