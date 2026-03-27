<p align="center">
  <img src="https://raw.githubusercontent.com/nara-chain/nara-web/main/public/favicon-v3.svg" width="48" />
</p>

<h3 align="center">Nara Explorer</h3>
<p align="center">
  Block explorer for the agent-native Layer 1.
  <br />
  <a href="https://explorer.nara.build">explorer.nara.build</a>
</p>

---

Inspect transactions, accounts, blocks, validators, and on-chain programs across Nara devnet and mainnet.

## Quick Start

```bash
pnpm install
pnpm dev
```

Default RPC endpoint: `https://devnet-api.nara.build/`

## Routes

```
/                        Dashboard — live stats, staking overview
/tx/[signature]          Transaction detail + instruction trace
/address/[address]       Account inspector (tokens, programs, IDL)
/block/[slot]            Block detail with rewards
/validators              Validator list and performance
/epoch/[epoch]           Epoch summary
/supply                  Network supply tracking
```

## Stack

```
Next.js 14 · React 18 · Nara Web3 SDK · Anchor · Radix UI · pnpm
```

## Contributing

Pull requests welcome. Please open an issue first for non-trivial changes.

## License

MIT

## Links

[Website](https://nara.build) · [Docs](https://nara.build/docs) · [Validator Explorer](https://validators.nara.build) · [GitHub](https://github.com/nara-chain) · [X](https://x.com/NaraBuildAI)
