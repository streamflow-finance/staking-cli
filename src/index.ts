#!/usr/bin/env node
import { Command } from '@commander-js/extra-typings';
import * as anchor from '@coral-xyz/anchor';
import { BN } from '@coral-xyz/anchor';
import {
  AuthorityType,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createSetAuthorityInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { PublicKey, Transaction } from '@solana/web3.js';
import fs from 'fs';

import { buildGovernorProgram, buildRewardDynamicProgram, buildStakeProgram } from './idl';
import {
  deriveGovernorPDA,
  deriveProposalPDA,
  deriveRewardEntryPDA,
  deriveRewardPoolPDA,
  deriveRewardVaultPDA,
  deriveStakeEntryPDA,
  deriveStakeMintPDA,
  deriveStakePoolPDA,
  deriveStakeVaultPDA,
  deriveVotePDA,
} from './pda';

const program = new Command()
  .name('streamflow-staking')
  .description('CLI to manage Streamflow staking pools, rewards pools and governors')
  .option('-u --url <url>', 'solana cluster URL', process.env.ANCHOR_PROVIDER_URL || 'https://api.devnet.solana.com')
  .option(
    '-k --keypair <path>',
    'Filepath of a keypair or base58 encoded private key',
    process.env.ANCHOR_WALLET || '~/.config/solana/id.json',
  )
  .version('1.0.0');

// Configure anchor provider
const configureProvider = (url: string, keypairOrPath: string) => {
  const connection = new anchor.web3.Connection(url);
  let keypair: anchor.web3.Keypair;
  if (fs.existsSync(keypairOrPath)) {
    const keyStr = JSON.parse(fs.readFileSync(keypairOrPath, 'utf8'));
    keypair = anchor.web3.Keypair.fromSeed(Buffer.from(keyStr).subarray(0, 32));
  } else {
    const decodedKey = anchor.utils.bytes.bs58.decode(keypairOrPath);
    const keyArr = new Uint8Array(
      decodedKey.buffer,
      decodedKey.byteOffset,
      decodedKey.byteLength / Uint8Array.BYTES_PER_ELEMENT,
    );
    keypair = anchor.web3.Keypair.fromSecretKey(keyArr);
  }
  const wallet = new anchor.Wallet(keypair);
  const provider = new anchor.AnchorProvider(connection, wallet);
  anchor.setProvider(provider);
  return provider;
};

// Stake Pool Commands
program
  .command('create-stake-pool')
  .description('Create a new stake pool')
  .requiredOption('-m, --mint <address>', 'token mint address')
  .option('-n, --nonce <number>', 'nonce for PDA derivation', '0')
  .option('--max-weight <number>', 'maximum weight multiplier (in basis points, e.g. 4000000000 for 4x)', '4000000000')
  .option('--min-duration <number>', 'minimum staking duration in seconds', '1')
  .option('--max-duration <number>', 'maximum staking duration in seconds', '31536000')
  .option('-p, --permissionless', 'allow anyone to create reward pools', false)
  .option('-f, --freeze', 'freeze token accounts', true)
  .option('--unstake-period <number>', 'period required for unstaking (seconds)', 'null')
  .option('--token-22', 'use token 2022 program', false)
  .action(async (options, command) => {
    try {
      const provider = configureProvider(command.optsWithGlobals().url, command.optsWithGlobals().keypair);
      const stakeProgram = buildStakeProgram(provider);

      const nonce = parseInt(options.nonce);
      const mintKey = new anchor.web3.PublicKey(options.mint);
      const maxWeight = new BN(options.maxWeight);
      const minDuration = new BN(options.minDuration);
      const maxDuration = new BN(options.maxDuration);
      const unstakePeriod = options.unstakePeriod === 'null' ? null : new BN(options.unstakePeriod);
      const tokenProgramId = options.token22 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

      const stakePoolKey = deriveStakePoolPDA(stakeProgram.programId, mintKey, provider.publicKey, nonce);
      const stakeMintKey = deriveStakeMintPDA(stakeProgram.programId, stakePoolKey);
      const stakeVaultKey = deriveStakeVaultPDA(stakeProgram.programId, stakePoolKey);

      console.log(`Creating stake pool with nonce ${nonce}`);
      console.log(`Mint: ${mintKey.toString()}`);
      console.log(`Stake Pool will be at: ${stakePoolKey.toString()}`);
      console.log(`Stake Mint will be at: ${stakeMintKey.toString()}`);
      console.log(`Stake Vault will be at: ${stakeVaultKey.toString()}`);

      const tx = await stakeProgram.methods
        .createPool(nonce, maxWeight, minDuration, maxDuration, options.permissionless, options.freeze, unstakePeriod)
        .accounts({
          creator: provider.publicKey,
          mint: mintKey,
          tokenProgram: tokenProgramId,
        })
        .rpc();

      console.log(`Stake pool created successfully!`);
      console.log(`Transaction: ${tx}`);
      console.log(`Stake Pool: ${stakePoolKey.toString()}`);
    } catch (error) {
      console.error('Error creating stake pool:', error);
    }
  });

program
  .command('set-token-metadata')
  .description('Set token metadata for stake mint')
  .requiredOption('-p, --pool <address>', 'stake pool address')
  .requiredOption('-n, --name <string>', 'token name')
  .requiredOption('-s, --symbol <string>', 'token symbol')
  .requiredOption('-m, --metadata-uri <string>', 'token metadata URI')
  .option('--token-22', 'use token 2022 program', false)
  .action(async (options, command) => {
    try {
      const provider = configureProvider(command.optsWithGlobals().url, command.optsWithGlobals().keypair);
      const stakeProgram = buildStakeProgram(provider);

      const stakePoolKey = new anchor.web3.PublicKey(options.pool);
      const stakeMintKey = deriveStakeMintPDA(stakeProgram.programId, stakePoolKey);

      console.log(`Setting metadata for stake mint ${stakeMintKey.toString()}`);
      console.log(`Name: ${options.name}`);
      console.log(`Symbol: ${options.symbol}`);
      console.log(`URI: ${options.metadataUri}`);

      let tx;
      if (options.token22) {
        tx = await stakeProgram.methods
          .setTokenMetadataT22(options.name, options.symbol, options.metadataUri)
          .accounts({
            stakePool: stakePoolKey,
          })
          .rpc();
      } else {
        tx = await stakeProgram.methods
          .setTokenMetadataSpl(options.name, options.symbol, options.metadataUri)
          .accounts({
            stakePool: stakePoolKey,
          })
          .rpc();
      }

      console.log(`Token metadata set successfully!`);
      console.log(`Transaction: ${tx}`);
    } catch (error) {
      console.error('Error setting token metadata:', error);
    }
  });

// Governor Commands
program
  .command('create-governor')
  .description('Create a new governor for a stake pool')
  .requiredOption('-p, --pool <address>', 'stake pool address')
  .option('-n, --nonce <number>', 'nonce for PDA derivation', '0')
  .action(async (options, command) => {
    try {
      const provider = configureProvider(command.optsWithGlobals().url, command.optsWithGlobals().keypair);
      const governorProgram = buildGovernorProgram(provider);

      const stakePoolKey = new anchor.web3.PublicKey(options.pool);
      const nonce = parseInt(options.nonce);

      const governorKey = deriveGovernorPDA(governorProgram.programId, stakePoolKey, nonce);

      console.log(`Creating governor with nonce ${nonce}`);
      console.log(`Stake Pool: ${stakePoolKey.toString()}`);
      console.log(`Governor will be at: ${governorKey.toString()}`);

      const tx = await governorProgram.methods
        .createGovernor(nonce)
        .accounts({
          stakePool: stakePoolKey,
          authority: provider.publicKey,
        })
        .rpc();

      console.log(`Governor created successfully!`);
      console.log(`Transaction: ${tx}`);
      console.log(`Governor: ${governorKey.toString()}`);
    } catch (error) {
      console.error('Error creating governor:', error);
    }
  });

program
  .command('add-proposal')
  .description('Add a new proposal to a governor')
  .requiredOption('-g, --governor <address>', 'governor address')
  .requiredOption('-t, --text <string>', 'proposal text')
  .requiredOption('-o, --options <comma-separated>', 'voting options as comma-separated list')
  .option('-n, --nonce <number>', 'nonce for PDA derivation', '0')
  .option('-s, --start <number>', 'voting start unix timestamp, 0 for now', '0')
  .option('-e, --end <number>', 'voting end timestamp unit timestamp, 0 for endless', '0')
  .action(async (options, command) => {
    try {
      const provider = configureProvider(command.optsWithGlobals().url, command.optsWithGlobals().keypair);
      const governorProgram = buildGovernorProgram(provider);

      const governorKey = new anchor.web3.PublicKey(options.governor);
      const nonce = parseInt(options.nonce);
      const name = options.text;
      const voteOptions = options.options.split(',').map((s) => s.trim());

      const startTs = new BN(options.start);
      const endTs = new BN(options.end);

      const proposalKey = deriveProposalPDA(governorProgram.programId, governorKey, nonce);

      console.log(`Creating proposal with nonce ${nonce}`);
      console.log(`Governor: ${governorKey.toString()}`);
      console.log(`Proposal will be at: ${proposalKey.toString()}`);
      console.log(`Name: ${name}`);
      console.log(`Options: ${voteOptions.join(', ')}`);
      console.log(`Voting period: ${startTs.toString()} to ${endTs.toString()}`);

      const tx = await governorProgram.methods
        .addProposal(nonce, name, voteOptions, startTs, endTs)
        .accounts({
          governor: governorKey,
          authority: provider.publicKey,
        })
        .rpc();

      console.log(`Proposal created successfully!`);
      console.log(`Transaction: ${tx}`);
      console.log(`Proposal: ${proposalKey.toString()}`);
    } catch (error) {
      console.error('Error creating proposal:', error);
    }
  });

program
  .command('activate-proposal')
  .description('Set a proposal as active in a governor')
  .requiredOption('-p, --proposal <address>', 'proposal address')
  .action(async (options, command) => {
    try {
      const provider = configureProvider(command.optsWithGlobals().url, command.optsWithGlobals().keypair);
      const governorProgram = buildGovernorProgram(provider);

      const proposalKey = new anchor.web3.PublicKey(options.proposal);

      console.log(`Activating proposal: ${proposalKey.toString()}`);

      const tx = await governorProgram.methods
        .setActiveProposal()
        .accounts({
          proposal: proposalKey,
          authority: provider.publicKey,
        })
        .rpc();

      console.log(`Proposal activated successfully!`);
      console.log(`Transaction: ${tx}`);
    } catch (error) {
      console.error('Error activating proposal:', error);
    }
  });

// Reward Pool Commands
program
  .command('create-reward-pool')
  .description('Create a new dynamic reward pool')
  .requiredOption('-s, --stake-pool <address>', 'stake pool address')
  .requiredOption('-m, --mint <address>', 'reward token mint address')
  .option('-n, --nonce <number>', 'nonce for PDA derivation', '0')
  .option('-p, --permissionless', 'allow anyone to create entries', false)
  .option('-g, --governor <address>', 'governor to be used for claiming and voting')
  .option('--claim-period <number>', 'period between reward claims in seconds', '3600')
  .option('--claim-start <number>', 'unix timestamp when claims can start (0 for current time)', '0')
  .option('--token-22', 'use token 2022 program', false)
  .action(async (options, command) => {
    try {
      const provider = configureProvider(command.optsWithGlobals().url, command.optsWithGlobals().keypair);
      const rewardDynamicProgram = buildRewardDynamicProgram(provider);

      const stakePoolKey = new anchor.web3.PublicKey(options.stakePool);
      const mintKey = new anchor.web3.PublicKey(options.mint);
      const nonce = parseInt(options.nonce);
      const permissionless = options.permissionless;
      const claimPeriod = new BN(options.claimPeriod);
      const claimStartTs = new BN(options.claimStart);
      const tokenProgramId = options.token22 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

      const rewardPoolKey = deriveRewardPoolPDA(rewardDynamicProgram.programId, stakePoolKey, mintKey, nonce);
      const rewardVaultKey = deriveRewardVaultPDA(rewardDynamicProgram.programId, rewardPoolKey);

      console.log(`Creating reward pool with nonce ${nonce}`);
      console.log(`Stake Pool: ${stakePoolKey.toString()}`);
      console.log(`Reward Mint: ${mintKey.toString()}`);
      console.log(`Reward Pool will be at: ${rewardPoolKey.toString()}`);
      console.log(`Reward Vault will be at: ${rewardVaultKey.toString()}`);

      const tx = await rewardDynamicProgram.methods
        .createPool(nonce, permissionless, claimPeriod, claimStartTs)
        .accounts({
          stakePool: stakePoolKey,
          mint: mintKey,
          creator: provider.publicKey,
          tokenProgram: tokenProgramId,
          governor: options.governor || null,
        })
        .rpc();

      console.log(`Reward pool created successfully!`);
      console.log(`Transaction: ${tx}`);
      console.log(`Reward Pool: ${rewardPoolKey.toString()}`);
    } catch (error) {
      console.error('Error creating reward pool:', error);
    }
  });

program
  .command('set-governor-for-reward-pool')
  .description('Set a governor for a reward pool')
  .requiredOption('-r, --reward-pool <address>', 'reward pool address')
  .requiredOption('-g, --governor <address>', 'governor address')
  .action(async (options, command) => {
    try {
      const provider = configureProvider(command.optsWithGlobals().url, command.optsWithGlobals().keypair);
      const rewardDynamicProgram = buildRewardDynamicProgram(provider);

      const rewardPoolKey = new anchor.web3.PublicKey(options.rewardPool);
      const governorKey = new anchor.web3.PublicKey(options.governor);

      console.log(`Setting governor for reward pool`);
      console.log(`Reward Pool: ${rewardPoolKey.toString()}`);
      console.log(`Governor: ${governorKey.toString()}`);

      const tx = await rewardDynamicProgram.methods
        .setGovernor()
        .accounts({
          rewardPool: rewardPoolKey,
          governor: governorKey,
          authority: provider.publicKey,
        })
        .rpc();

      console.log(`Governor set for reward pool successfully!`);
      console.log(`Transaction: ${tx}`);
    } catch (error) {
      console.error('Error setting governor for reward pool:', error);
    }
  });

program
  .command('fund-reward-pool')
  .description('Fund a reward pool with tokens')
  .requiredOption('-r, --reward-pool <address>', 'reward pool address')
  .requiredOption('-a, --amount <number>', 'amount to fund (in base units)')
  .option('--token-22', 'use token 2022 program', false)
  .action(async (options, command) => {
    try {
      const provider = configureProvider(command.optsWithGlobals().url, command.optsWithGlobals().keypair);
      const rewardDynamicProgram = buildRewardDynamicProgram(provider);

      const rewardPoolKey = new anchor.web3.PublicKey(options.rewardPool);
      const fundAmount = new BN(options.amount);

      // Fetch reward pool data to get the mint
      const rewardPool = await rewardDynamicProgram.account.rewardPool.fetch(rewardPoolKey);
      const rewardMint = rewardPool.mint;
      const tokenProgramId = options.token22 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

      // Get associated token accounts
      const rewardMintAccountKey = getAssociatedTokenAddressSync(rewardMint, provider.publicKey, false, tokenProgramId);

      console.log(`Funding reward pool`);
      console.log(`Reward Pool: ${rewardPoolKey.toString()}`);
      console.log(`Amount: ${fundAmount.toString()}`);
      console.log(`From: ${rewardMintAccountKey.toString()}`);

      const tx = await rewardDynamicProgram.methods
        .fundPool(fundAmount)
        .accounts({
          rewardPool: rewardPoolKey,
          from: rewardMintAccountKey,
          tokenProgram: tokenProgramId,
        })
        .accountsPartial({
          feeValue: null,
        })
        .rpc();

      console.log(`Reward pool funded successfully!`);
      console.log(`Transaction: ${tx}`);
    } catch (error) {
      console.error('Error funding reward pool:', error);
    }
  });

// Stake Pool Authority Transfer
program
  .command('transfer-stake-pool-authority')
  .description('Transfer authority of a stake pool to a new authority')
  .requiredOption('-p, --pool <address>', 'stake pool address')
  .requiredOption('-n, --new-authority <address>', 'new authority address')
  .action(async (options, command) => {
    try {
      const provider = configureProvider(command.optsWithGlobals().url, command.optsWithGlobals().keypair);
      const stakeProgram = buildStakeProgram(provider);

      const stakePoolKey = new anchor.web3.PublicKey(options.pool);
      const newAuthorityKey = new anchor.web3.PublicKey(options.newAuthority);

      console.log(`Transferring stake pool authority`);
      console.log(`Stake Pool: ${stakePoolKey.toString()}`);
      console.log(`Current Authority: ${provider.publicKey.toString()}`);
      console.log(`New Authority: ${newAuthorityKey.toString()}`);

      const tx = await stakeProgram.methods
        .changeAuthority()
        .accounts({
          stakePool: stakePoolKey,
          authority: provider.publicKey,
          newAuthority: newAuthorityKey,
        })
        .rpc();

      console.log(`Stake pool authority transferred successfully!`);
      console.log(`Transaction: ${tx}`);
    } catch (error) {
      console.error('Error transferring stake pool authority:', error);
    }
  });

// Reward Pool Authority Transfer
program
  .command('transfer-reward-pool-authority')
  .description('Transfer authority of a reward pool to a new authority')
  .requiredOption('-p, --pool <address>', 'reward pool address')
  .requiredOption('-n, --new-authority <address>', 'new authority address')
  .action(async (options, command) => {
    try {
      const provider = configureProvider(command.optsWithGlobals().url, command.optsWithGlobals().keypair);
      const rewardDynamicProgram = buildRewardDynamicProgram(provider);

      const rewardPoolKey = new anchor.web3.PublicKey(options.pool);
      const newAuthorityKey = new anchor.web3.PublicKey(options.newAuthority);

      console.log(`Transferring reward pool authority`);
      console.log(`Reward Pool: ${rewardPoolKey.toString()}`);
      console.log(`Current Authority: ${provider.publicKey.toString()}`);
      console.log(`New Authority: ${newAuthorityKey.toString()}`);

      const tx = await rewardDynamicProgram.methods
        .changeAuthority()
        .accounts({
          rewardPool: rewardPoolKey,
          authority: provider.publicKey,
          newAuthority: newAuthorityKey,
        })
        .rpc();

      console.log(`Reward pool authority transferred successfully!`);
      console.log(`Transaction: ${tx}`);
    } catch (error) {
      console.error('Error transferring reward pool authority:', error);
    }
  });

program
  .command('transfer-fee-withdraw-authority')
  .description('Transfer withdrawn authority of a Token2022 mint with TransferFeeConfig')
  .requiredOption('-m, --mint <address>', 'mint')
  .requiredOption('-n, --new-authority <address>', 'new authority address')
  .action(async (options, command) => {
    try {
      const provider = configureProvider(command.optsWithGlobals().url, command.optsWithGlobals().keypair);
      const mintKey = new PublicKey(options.mint);
      const newAuthorityKey = new PublicKey(options.newAuthority);
      const account = await provider.connection.getAccountInfo(mintKey);

      console.log(`Transferring withdraw withheld authority`);
      console.log(`Mint: ${mintKey.toString()}`);
      console.log(`Current Authority: ${provider.publicKey.toString()}`);
      console.log(`New Authority: ${newAuthorityKey.toString()}`);

      const ix = createSetAuthorityInstruction(
        mintKey,
        provider.publicKey,
        AuthorityType.WithheldWithdraw,
        newAuthorityKey,
        undefined,
        account!.owner,
      );
      const transaction = new Transaction().add(ix);
      const signature = await provider.sendAndConfirm(transaction);

      console.log(`Withdraw withheld authority transferred successfully!`);
      console.log(`Transaction: ${signature}`);
    } catch (error) {
      console.error('Error transferring reward pool authority:', error);
    }
  });

// Stake Pool - Lookup Table
program
  .command('create-lookup-table')
  .description('Create a new address lookup table for a stake pool and optionally extend it with addresses')
  .requiredOption('-p --stake-pool <address>', 'stake pool address')
  .option('-n --nonce <number>', 'unique nonce for lookup table link', '0')
  .option('--recent-slot <number>', 'recent slot to seed lookup table creation')
  .option('--authority <address>', 'authority of the lookup table (defaults to wallet)')
  .option('--addresses <addresses...>', 'space separated list of addresses to add to the lookup table')
  .action(async (options, command) => {
    try {
      const provider = configureProvider(command.optsWithGlobals().url, command.optsWithGlobals().keypair);
      const stakeProgram = buildStakeProgram(provider);

      const stakePoolKey = new PublicKey(options.stakePool);
      const nonce = parseInt(options.nonce);
      const recentSlot = BigInt(options.recentSlot ? options.recentSlot : await provider.connection.getSlot());

      // Compute the expected lookup table address for transparency
      const lookupTableAddress = anchor.web3.AddressLookupTableProgram.createLookupTable({
        authority: provider.publicKey,
        payer: provider.publicKey,
        recentSlot,
      })[1];

      console.log(`Creating lookup table link for stake pool ${stakePoolKey.toString()}`);
      console.log(`Nonce: ${nonce}`);
      console.log(`Recent slot: ${recentSlot.toString()}`);
      console.log(`Lookup Table (expected): ${lookupTableAddress.toString()}`);

      // Call on-chain program to create the lookup table and link account
      const txSig = await stakeProgram.methods
        .createLookupTable(nonce, new BN(Number(recentSlot)))
        .accounts({
          stakePool: stakePoolKey,
          lookupTable: lookupTableAddress,
          payer: provider.publicKey,
          authority: provider.publicKey,
        })
        .rpc();

      console.log(`Lookup table created. Tx: ${txSig}`);

      // If addresses were passed, extend the table in chunks of up to 20 per instruction
      if (options.addresses && Array.isArray(options.addresses) && options.addresses.length > 0) {
        const allAddresses: PublicKey[] = options.addresses.map((a: string) => new PublicKey(a));
        const CHUNK = 20; // max 20 addresses per extend
        for (let i = 0; i < allAddresses.length; i += CHUNK) {
          const chunk = allAddresses.slice(i, i + CHUNK);
          const extendIx = anchor.web3.AddressLookupTableProgram.extendLookupTable({
            payer: provider.publicKey,
            authority: provider.publicKey,
            lookupTable: lookupTableAddress,
            addresses: chunk,
          });
          const latestBlockhash = await provider.connection.getLatestBlockhash();
          const message = new anchor.web3.TransactionMessage({
            payerKey: provider.publicKey,
            recentBlockhash: latestBlockhash.blockhash,
            instructions: [extendIx],
          }).compileToV0Message();
          const vtx = new anchor.web3.VersionedTransaction(message);
          // Sign if payer is the wallet; otherwise, additional signing would be needed
          // since CLI only uses the configured wallet, this supports when payer==wallet
          const sig = await provider.sendAndConfirm(vtx);
          console.log(`Extended lookup table with ${chunk.length} addresses. Tx: ${sig}`);
        }
      }

      console.log(`Lookup table address: ${lookupTableAddress.toString()}`);
    } catch (error) {
      console.error('Error creating/extending lookup table:', error);
    }
  });

// Helper commands
program
  .command('get-derived-addresses')
  .description('Get derived addresses from given parameters')
  .option('--stake-pool <address>', 'stake pool address')
  .option('-a, --authority <address>', 'authority address (defaults to current wallet)')
  .option('-m, --mint <address>', 'token mint address')
  .option('--reward-mint <address>', 'reward mint address')
  .option('--reward-pool <address>', 'reward pool address')
  .option('-g, --governor <address>', 'governor address')
  .option('-p, --proposal <address>', 'proposal address')
  .option('--stake-entry <address>', 'stake entry address')
  .option('-n, --nonce <number>', 'nonce for PDA derivation', '0')
  .option('--stake-entry-nonce <number>', 'nonce for stake entry PDA derivation', '0')
  .option('--proposal-nonce <number>', 'nonce for proposal PDA derivation', '0')
  .action(async (options, command) => {
    try {
      const provider = configureProvider(command.optsWithGlobals().url, command.optsWithGlobals().keypair);

      const stakeProgram = buildStakeProgram(provider);
      const governorProgram = buildGovernorProgram(provider);
      const rewardDynamicProgram = buildRewardDynamicProgram(provider);

      const nonce = parseInt(options.nonce);
      const stakeEntryNonce = parseInt(options.stakeEntryNonce);
      const proposalNonce = parseInt(options.proposalNonce);
      const authority = options.authority ? new PublicKey(options.authority) : provider.publicKey;

      console.log('Derived addresses:');

      if (options.mint && options.authority) {
        const stakePoolKey = deriveStakePoolPDA(stakeProgram.programId, new PublicKey(options.mint), authority, nonce);
        console.log(`Stake Pool: ${stakePoolKey.toString()}`);

        const stakeMintKey = deriveStakeMintPDA(stakeProgram.programId, stakePoolKey);
        console.log(`Stake Mint: ${stakeMintKey.toString()}`);

        const stakeVaultKey = deriveStakeVaultPDA(stakeProgram.programId, stakePoolKey);
        console.log(`Stake Vault: ${stakeVaultKey.toString()}`);
      }

      if (options.stakePool) {
        const stakePoolKey = new PublicKey(options.stakePool);

        if (options.authority) {
          const stakeEntryKey = deriveStakeEntryPDA(stakeProgram.programId, stakePoolKey, authority, stakeEntryNonce);
          console.log(`Stake Entry: ${stakeEntryKey.toString()}`);
        }

        const governorKey = deriveGovernorPDA(governorProgram.programId, stakePoolKey, nonce);
        console.log(`Governor: ${governorKey.toString()}`);

        if (options.rewardMint) {
          const rewardPoolKey = deriveRewardPoolPDA(
            rewardDynamicProgram.programId,
            stakePoolKey,
            new PublicKey(options.rewardMint),
            nonce,
          );
          console.log(`Reward Pool: ${rewardPoolKey.toString()}`);

          const rewardVaultKey = deriveRewardVaultPDA(rewardDynamicProgram.programId, rewardPoolKey);
          console.log(`Reward Vault: ${rewardVaultKey.toString()}`);
        }
      }

      if (options.governor) {
        const governorKey = new PublicKey(options.governor);

        const proposalKey = deriveProposalPDA(governorProgram.programId, governorKey, proposalNonce);
        console.log(`Proposal: ${proposalKey.toString()}`);
      }

      if (options.proposal && options.authority) {
        const voteKey = deriveVotePDA(governorProgram.programId, new PublicKey(options.proposal), authority);
        console.log(`Vote: ${voteKey.toString()}`);
      }

      if (options.rewardPool && options.stakeEntry) {
        const rewardEntryKey = deriveRewardEntryPDA(
          rewardDynamicProgram.programId,
          new PublicKey(options.rewardPool),
          new PublicKey(options.stakeEntry),
        );
        console.log(`Reward Entry: ${rewardEntryKey.toString()}`);
      }
    } catch (error) {
      console.error('Error getting derived addresses:', error);
    }
  });

program.parse();
