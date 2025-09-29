# Streamflow Staking CLI

A command-line interface tool for managing Streamflow staking pools, rewards pools, and governors on Solana.

## Prerequisites

### Install Node.js

This project requires Node.js version 20. You can install it using:

#### Using nvm (recommended):
```bash
# Install nvm if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart your terminal or run:
source ~/.bashrc

# Install and use Node.js 20
nvm install 20
nvm use 20
```

#### Using Node.js installer:
Download and install Node.js 20 from [nodejs.org](https://nodejs.org/)

#### Using Homebrew (macOS):
```bash
brew install node@20
```

### Verify Installation
```bash
node --version
# Should output: v20.x.x
```

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Make the CLI script executable
chmod +x cli.sh
```

## Usage

### Running the CLI

The recommended way to run the CLI is using the shell script, which automatically detects whether to use TypeScript (development) or JavaScript (production):

```bash
./cli.sh <command> [options]
```

**Alternative methods:**
- **Direct TypeScript execution:** `npx tsx src/index.ts <command> [options]`
- **Direct JavaScript execution:** `node dist/index.js <command> [options]`

### Global Options

- `-u, --url <url>`: Solana cluster URL (default: https://api.devnet.solana.com)
- `-k, --keypair <path>`: Filepath of a keypair or base58 encoded private key (default: ~/.config/solana/id.json)

### Stake Pool Commands

#### Create Stake Pool
```bash
./cli.sh create-stake-pool -m <mint-address> [options]
```

Options:
- `-n, --nonce <number>`: Nonce for PDA derivation (default: 0)
- `--max-weight <number>`: Maximum weight multiplier in basis points (default: 4000000000 for 4x)
- `--min-duration <number>`: Minimum staking duration in seconds (default: 0)
- `--max-duration <number>`: Maximum staking duration in seconds (default: 31536000)
- `-p, --permissionless`: Allow anyone to create reward pools (default: false)
- `-f, --freeze`: Freeze token accounts (default: true)
- `--unstake-period <number>`: Period required for unstaking in seconds (default: null)
- `--token-22`: Use token 2022 program (default: false)

#### Set Token Metadata
```bash
./cli.sh set-token-metadata -p <pool-address> -n <name> -s <symbol> -m <metadata-uri> [--token-22]
```

### Governor Commands

#### Create Governor
```bash
./cli.sh create-governor -p <pool-address> [-n <nonce>]
```

#### Add Proposal
```bash
./cli.sh add-proposal -g <governor-address> -t <text> -o <options> [options]
```

Options:
- `-n, --nonce <number>`: Nonce for PDA derivation (default: 0)
- `-s, --start <number>`: Voting start unix timestamp, 0 for now (default: 0)
- `-e, --end <number>`: Voting end unix timestamp, 0 for endless (default: 0)

#### Activate Proposal
```bash
./cli.sh activate-proposal -p <proposal-address>
```

### Reward Pool Commands

#### Create Reward Pool
```bash
./cli.sh create-reward-pool -s <stake-pool-address> -m <mint-address> [options]
```

Options:
- `-n, --nonce <number>`: Nonce for PDA derivation (default: 0)
- `-p, --permissionless`: Allow anyone to create entries (default: false)
- `-g, --governor <address>`: Governor to be used for claiming and voting
- `--claim-period <number>`: Period between reward claims in seconds (default: 3600)
- `--claim-start <number>`: Unix timestamp when claims can start, 0 for current time (default: 0)
- `--token-22`: Use token 2022 program (default: false)

#### Set Governor for Reward Pool
```bash
./cli.sh set-governor-for-reward-pool -r <reward-pool-address> -g <governor-address>
```

#### Fund Reward Pool
```bash
./cli.sh fund-reward-pool -r <reward-pool-address> -a <amount> [--token-22]
```

### Helper Commands

#### Get Derived Addresses
```bash
./cli.sh get-derived-addresses [options]
```

Options:
- `--stake-pool <address>`: Stake pool address
- `-a, --authority <address>`: Authority address (defaults to current wallet)
- `-m, --mint <address>`: Token mint address
- `--reward-mint <address>`: Reward mint address
- `--reward-pool <address>`: Reward pool address
- `-g, --governor <address>`: Governor address
- `-p, --proposal <address>`: Proposal address
- `--stake-entry <address>`: Stake entry address
- `-n, --nonce <number>`: Nonce for PDA derivation (default: 0)
- `--stake-entry-nonce <number>`: Nonce for stake entry PDA derivation (default: 0)
- `--proposal-nonce <number>`: Nonce for proposal PDA derivation (default: 0)

#### Claim Entry
```bash
./cli.sh claim-entry -t <to-address> [-e <entry-address> | -f <file-path>] [--burn]
```

Options:
- `-e, --entry <address>`: A single stake entry address to claim
- `-f, --file <path>`: Path to a file with stake entry addresses to claim
- `-t, --to <address>`: Token account that should receive staked tokens (required)
- `--burn`: Whether to burn staked tokens after receiving (default: false)

## Examples

### Create a Stake Pool
```bash
./cli.sh create-stake-pool -m 4NQJMooXchX5He3CTHC8usQYby7LQRX3eYmALzEBGQz5
```

### Create a Governor
```bash
./cli.sh create-governor -p <stake-pool-address>
```

### Create a Reward Pool
```bash
./cli.sh create-reward-pool -s <stake-pool-address> -m <reward-mint-address>
```

### Fund a Reward Pool
```bash
./cli.sh fund-reward-pool -r <reward-pool-address> -a <amount> -k <keypair-path> -u <rpc-url>
```

### Get Derived Addresses
```bash
./cli.sh get-derived-addresses -m <mint-address> -a <authority-address>
```

### Transfer Stake Pool Authority
```bash
./cli.sh transfer-stake-pool-authority -p <stake-pool-address> -n <new-authority-address> -k <keypair-path> -u <rpc-url>
```

### Transfer Reward Pool Authority
```bash
./cli.sh transfer-reward-pool-authority -p <reward-pool-address> -n <new-authority-address> -k <keypair-path> -u <rpc-url>
```

### Transfer Token 2022 Transfer Fee Withdraw Authority
```bash
./cli.sh transfer-fee-withdraw-authority -m <mint-address> -n <new-authority-address> -k <keypair-path> -u <rpc-url>
```

### Create Lookup Table

A helper instruction that creates a Lookup Table and connects it to a specific stake pool (a PDA account that just stores stake pool -> ALT link).

```bash
./cli.sh create-lookup-table -p <stake-pool> --addresses ... -k <keypair-path> -u <rpc-url>
```

## Environment Variables

- `ANCHOR_PROVIDER_URL`: Solana cluster URL
- `ANCHOR_WALLET`: Path to wallet keypair file

## Development

```bash
# Ensure you're using Node.js 20
nvm use 20

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run built version
npm start
```