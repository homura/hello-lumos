import { BI } from "@ckb-lumos/lumos";
import { ALICE_LOCK_SCRIPT, indexer } from "./01-initialize";

async function main() {
  let totalCapacity = BI.from(0);

  const collector = indexer.collector({ lock: ALICE_LOCK_SCRIPT });
  for await (const cell of collector.collect()) {
    // 🐛 we can add a debugger next line to check collected cells
    console.log(cell);
    totalCapacity = totalCapacity.add(cell.cellOutput.capacity);
  }

  console.log(`total capacity(in shannon) of Alice's is:`, totalCapacity.toString());
  console.log(`tips: 1 CKB = 10**8 shannon`);
}

main();
