import { ALICE_ADDRESS } from "./01-initialize";

function main() {
  console.log(1, `Copy Alice's address`, ALICE_ADDRESS);
  console.log(2, `Go to https://faucet.nervos.org/ and input Alice's address to claim some faucet CKB`);
  console.log(3, `Waiting for the transaction is committed`);
  console.log(4, `Checking CKB balance on explorer https://pudge.explorer.nervos.org/address/${ALICE_ADDRESS}`);
}

main();
