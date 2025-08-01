# Streamflow Staking CLI Example

## Prerequisites

Be sure to create a file containing your wallet private key and reference it for each command. In this example it will be called `key.json` and will be stored in this repo.

## ⚠️ **IMPORTANT: Nonce Management**

> When creating pools with the same parameters (mint, authority, etc.), you **MUST** increment the nonce value. Each nonce can only be used once for the same combination of parameters.
>
> **Example:** If you create a stake pool with nonce `0` and it fails, you cannot reuse nonce `0` - you must use nonce `1` for the next attempt.

## Staking Pool Creation

This command creates a staking pool of a given `TOKEN_ADDRESS`.

### Command Parameters

- **Max weight**: `1000000000` (translates to 1 with precision, as it should be for dynamic reward pool)
- **Minimum duration**: `7776000` seconds (90 days) - how long people should stake
- **Maximum duration**: `7776000` seconds (90 days)
- **Unstake period**: `0` seconds
- **Freeze authority**: Enabled (`-f` flag)
- **Nonce**: `1` (random number) - **⚠️ MUST be incremented for same parameters**

### Example Commands

#### Using shell script (Most Reliable)
```bash
# Automatically detects development/production mode
./cli.sh create-stake-pool \
  -m "TOKEN_ADDRESS" \
  -k key.json \
  --max-weight 1000000000 \
  --min-duration 7776000 \
  --max-duration 7776000 \
  --unstake-period 0 \
  -f \
  -n 1 \
  -u PUBLIC_RPC_LINK
```

#### Using direct node commands
```bash
# For development (TypeScript)
npx tsx src/index.ts create-stake-pool \
  -m "TOKEN_ADDRESS" \
  -k key.json \
  --max-weight 1000000000 \
  --min-duration 7776000 \
  --max-duration 7776000 \
  --unstake-period 0 \
  -f \
  -n 1 \
  -u PUBLIC_RPC_LINK

# For production (JavaScript)
node dist/index.js create-stake-pool \
  -m "TOKEN_ADDRESS" \
  -k key.json \
  --max-weight 1000000000 \
  --min-duration 7776000 \
  --max-duration 7776000 \
  --unstake-period 0 \
  -f \
  -n 1 \
  -u PUBLIC_RPC_LINK
```

### Parameter Breakdown

| Parameter | Value | Description |
|-----------|-------|-------------|
| `-m` | `TOKEN_ADDRESS` | Token mint address |
| `-k` | `key.json` | Keypair file path |
| `--max-weight` | `1000000000` | Maximum weight multiplier (1.0 with precision) |
| `--min-duration` | `7776000` | Minimum staking duration (90 days in seconds) |
| `--max-duration` | `7776000` | Maximum staking duration (90 days in seconds) |
| `--unstake-period` | `0` | Period required for unstaking (0 seconds) |
| `-f` | - | Enable freeze authority |
| `-n` | `1` | **⚠️ Nonce for PDA derivation (MUST be incremented for same parameters)** |
| `-u` | `PUBLIC_RPC_LINK` | Solana RPC endpoint URL |

## Reward Pool Creation

This command creates a reward pool for a given `TOKEN_ADDRESS` associated with a given `STAKE_POOL`.

### Command Parameters

- **Claim period**: `1000` seconds - duration for claiming rewards
- **Claim start**: `1753911142` - timestamp when claiming can begin
- **Nonce**: `1` (random number) - **⚠️ MUST be incremented for same parameters**

### Example Commands

#### Using shell script (Most Reliable)
```bash
# Automatically detects development/production mode
./cli.sh create-reward-pool \
  -m "TOKEN_ADDRESS" \
  -s "STAKE_POOL" \
  -k key.json \
  --claim-period 1000 \
  --claim-start 1753911142 \
  -n 1 \
  -u PUBLIC_RPC_LINK
```

#### Using direct node commands
```bash
# For development (TypeScript)
npx tsx src/index.ts create-reward-pool \
  -m "TOKEN_ADDRESS" \
  -s "STAKE_POOL" \
  -k key.json \
  --claim-period 1000 \
  --claim-start 1753911142 \
  -n 1 \
  -u PUBLIC_RPC_LINK

# For production (JavaScript)
node dist/index.js create-reward-pool \
  -m "TOKEN_ADDRESS" \
  -s "STAKE_POOL" \
  -k key.json \
  --claim-period 1000 \
  --claim-start 1753911142 \
  -n 1 \
  -u PUBLIC_RPC_LINK
```

### Parameter Breakdown

| Parameter | Value | Description |
|-----------|-------|-------------|
| `-m` | `TOKEN_ADDRESS` | Token mint address |
| `-s` | `STAKE_POOL` | Stake pool address |
| `-k` | `key.json` | Keypair file path |
| `--claim-period` | `1000` | Duration for claiming rewards (in seconds) |
| `--claim-start` | `1753911142` | Timestamp when claiming can begin |
| `-n` | `1` | **⚠️ Nonce for PDA derivation (MUST be incremented for same parameters)** |
| `-u` | `PUBLIC_RPC_LINK` | Solana RPC endpoint URL |

## Reward Pool Funding

This command funds a reward pool with tokens for distribution to stakers.

### Command Parameters

- **Amount**: `12345` - amount of tokens to fund (in smallest unit)
- **Reward pool ID**: The address of the reward pool to fund

### Example Commands

#### Using shell script (Most Reliable)
```bash
# Automatically detects development/production mode
./cli.sh fund-reward-pool \
  -r "REWARD_POOL_ID" \
  -a "12345" \
  -k key.json \
  -u PUBLIC_RPC_LINK
```

#### Using direct node commands
```bash
# For development (TypeScript)
npx tsx src/index.ts fund-reward-pool \
  -r "REWARD_POOL_ID" \
  -a "12345" \
  -k key.json \
  -u PUBLIC_RPC_LINK

# For production (JavaScript)
node dist/index.js fund-reward-pool \
  -r "REWARD_POOL_ID" \
  -a "12345" \
  -k key.json \
  -u PUBLIC_RPC_LINK
```

### Parameter Breakdown

| Parameter | Value | Description |
|-----------|-------|-------------|
| `-r` | `REWARD_POOL_ID` | Reward pool address to fund |
| `-a` | `12345` | Amount of tokens to fund (in smallest unit) |
| `-k` | `key.json` | Keypair file path |
| `-u` | `PUBLIC_RPC_LINK` | Solana RPC endpoint URL |