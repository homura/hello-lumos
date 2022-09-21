---
marp: true
theme: uncover
class: invert
---

# Lumos

Helps you build CKB-based dApps

---

## Features

- Transfer CKB/sUDT, DAO operation
- Test, deploy, upgrade contract
- HD wallet
- Works in the browser or NodeJS
- Gadgets such as address convertor, deserialization

---

## At a Glance

```js
txSkeleton = transfer(txSkeleton, [ALICE_ADDRESS], BOB_ADDRESS, 100e8);
txSkeleton = payFeeByFeeRate(txSkeleton, [ALICE_ADDRESS], 1000);
txSkeleton = prepareSigningEntries(txSkeleton);
signatures = entries.map((entry) => signRecoverable(entry.message, ALICE_PRIVATE_KEY));
signedTx = helpers.sealTransaction(txSkeleton, signatures);
sendTransaction(signedTx);
```

---

## Structure

```
├── examples
├── packages
├── website
├── babel.config.js
├── lerna.json
├── package.json
├── tsconfig.json
└── yarn.lock
```

<!--

- Lumos is organized as a monorepo, modules are under `/packages`
- There are various examples under `/examples`, which can generally be run in the browser
- `website` provides docs and gadgets that you can use out of the box
-->

---

## Packages

Lumos is organized as a monorepo

```mermaid
graph TD;
    linkStyle default interpolate basis
    bi-->base;
    codec-->base;
    toolkit-->base;
    base-->ckb_indexer;
    bi-->ckb_indexer;
    rpc-->ckb_indexer;
    toolkit-->ckb_indexer;
    testkit-->ckb_indexer;
    bi-->codec;
    base-->common_scripts;
    bi-->common_scripts;
    codec-->common_scripts;
    config_manager-->common_scripts;
    helpers-->common_scripts;
    rpc-->common_scripts;
    toolkit-->common_scripts;
    base-->config_manager;
    bi-->config_manager;
    codec-->config_manager;
    base-->debugger;
    bi-->debugger;
    codec-->debugger;
    config_manager-->debugger;
    helpers-->debugger;
    rpc-->debugger;
    experiment_tx_assembler-->debugger;
    base-->experiment_tx_assembler;
    config_manager-->experiment_tx_assembler;
    helpers-->experiment_tx_assembler;
    toolkit-->experiment_tx_assembler;
    base-->hd;
    bi-->hd;
    base-->hd_cache;
    bi-->hd_cache;
    ckb_indexer-->hd_cache;
    config_manager-->hd_cache;
    hd-->hd_cache;
    rpc-->hd_cache;
    base-->helpers;
    bi-->helpers;
    config_manager-->helpers;
    toolkit-->helpers;
    base-->lumos;
    bi-->lumos;
    ckb_indexer-->lumos;
    common_scripts-->lumos;
    config_manager-->lumos;
    hd-->lumos;
    helpers-->lumos;
    rpc-->lumos;
    toolkit-->lumos;
    base-->rpc;
    bi-->rpc;
    base-->testkit;
    bi-->testkit;
    codec-->testkit;
    base-->transaction_manager;
    ckb_indexer-->transaction_manager;
    rpc-->transaction_manager;
    toolkit-->transaction_manager;
```

<!--

some commonly used modules:

- common-scripts: build common transactions, such as transferring CKB or sUDT
- codec: serialization and deserialization, works with molecule
- config-manager: Manage script config required in dApp
- ckb-indexer: collect UTxOs
- hd: HD wallet/keys
-->

---

## History

|          | Before        | Current         |
| -------- | ------------- | --------------- |
| Runtime  | NodeJS        | NodeJS +Browser |
| Indexer  | Lumos Indexer | CKB Indexer     |
| Molecule | Codegen       | Binding         |

---

## Send My First Transaction

<!--

`/tutorial`

-->

---

## Next Step

- More friendly documentation and example
- Provider with friendly API
- Common wallet integration
- Support open transaction
- More friendly plugin system

---

## Any Question?

- Open An Issue on [Lumos](https://github.com/ckb-js/lumos/issues)
- Or [Contract Me](mailto://homura.dev@gmail.com)

---

## Practices

- Transfer CKB via Omnilock and MetaMask
- Transfer CKB or sUDT to multiple locks
- [Build A tx to exchange sudt for CKB](https://github.com/nervosnetwork/ckit/issues/108)
