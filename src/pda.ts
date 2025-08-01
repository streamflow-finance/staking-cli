import * as anchor from '@coral-xyz/anchor';
import {
  CONFIG_PREFIX,
  FEE_VALUE_PREFIX,
  GOVERNOR_PREFIX,
  LOOKUP_TABLE_PREFIX,
  METADATA_PREFIX,
  PROPOSAL_PREFIX,
  REWARD_ENTRY_PREFIX,
  REWARD_POOL_PREFIX,
  REWARD_VAULT_PREFIX,
  STAKE_ENTRY_PREFIX,
  STAKE_MINT_PREFIX,
  STAKE_POOL_PREFIX,
  STAKE_VAULT_PREFIX,
  VOTE_PREFIX,
} from './constants';

export const deriveStakePoolPDA = (
  programId: anchor.web3.PublicKey,
  mint: anchor.web3.PublicKey,
  authority: anchor.web3.PublicKey,
  nonce: number,
): anchor.web3.PublicKey => {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [STAKE_POOL_PREFIX, mint.toBuffer(), authority.toBuffer(), new anchor.BN(nonce).toArrayLike(Buffer, 'le', 1)],
    programId,
  )[0];
};

export const deriveStakeVaultPDA = (
  programId: anchor.web3.PublicKey,
  stakePool: anchor.web3.PublicKey,
): anchor.web3.PublicKey => {
  return anchor.web3.PublicKey.findProgramAddressSync([STAKE_VAULT_PREFIX, stakePool.toBuffer()], programId)[0];
};

export const deriveStakeMintPDA = (
  programId: anchor.web3.PublicKey,
  stakePool: anchor.web3.PublicKey,
): anchor.web3.PublicKey => {
  return anchor.web3.PublicKey.findProgramAddressSync([STAKE_MINT_PREFIX, stakePool.toBuffer()], programId)[0];
};

export const deriveStakeEntryPDA = (
  programId: anchor.web3.PublicKey,
  stakePool: anchor.web3.PublicKey,
  authority: anchor.web3.PublicKey,
  nonce: number,
): anchor.web3.PublicKey => {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [STAKE_ENTRY_PREFIX, stakePool.toBuffer(), authority.toBuffer(), new anchor.BN(nonce).toArrayLike(Buffer, 'le', 4)],
    programId,
  )[0];
};

export const deriveLookupTableLinkPDA = (
  programId: anchor.web3.PublicKey,
  stakePool: anchor.web3.PublicKey,
  authority: anchor.web3.PublicKey,
  nonce: number,
): anchor.web3.PublicKey => {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [
      LOOKUP_TABLE_PREFIX,
      stakePool.toBuffer(),
      authority.toBuffer(),
      new anchor.BN(nonce).toArrayLike(Buffer, 'le', 4),
    ],
    programId,
  )[0];
};

export function deriveGovernorPDA(
  programId: anchor.web3.PublicKey,
  stakePool: anchor.web3.PublicKey,
  nonce: number,
): anchor.web3.PublicKey {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [GOVERNOR_PREFIX, stakePool.toBuffer(), Buffer.from([nonce])],
    programId,
  )[0];
}

export function deriveProposalPDA(
  programId: anchor.web3.PublicKey,
  governor: anchor.web3.PublicKey,
  nonce: number,
): anchor.web3.PublicKey {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [PROPOSAL_PREFIX, governor.toBuffer(), new anchor.BN(nonce).toArrayLike(Buffer, 'le', 4)],
    programId,
  )[0];
}

export function deriveVotePDA(
  programId: anchor.web3.PublicKey,
  proposal: anchor.web3.PublicKey,
  voter: anchor.web3.PublicKey,
): anchor.web3.PublicKey {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [VOTE_PREFIX, proposal.toBuffer(), voter.toBuffer()],
    programId,
  )[0];
}

export const deriveRewardPoolPDA = (
  programId: anchor.web3.PublicKey,
  stakePool: anchor.web3.PublicKey,
  mint: anchor.web3.PublicKey,
  nonce: number,
): anchor.web3.PublicKey => {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [REWARD_POOL_PREFIX, stakePool.toBuffer(), mint.toBuffer(), new anchor.BN(nonce).toArrayLike(Buffer, 'le', 1)],
    programId,
  )[0];
};

export const deriveRewardVaultPDA = (
  programId: anchor.web3.PublicKey,
  rewardPool: anchor.web3.PublicKey,
): anchor.web3.PublicKey => {
  return anchor.web3.PublicKey.findProgramAddressSync([REWARD_VAULT_PREFIX, rewardPool.toBuffer()], programId)[0];
};

export const deriveRewardEntryPDA = (
  programId: anchor.web3.PublicKey,
  rewardPool: anchor.web3.PublicKey,
  stakeEntry: anchor.web3.PublicKey,
): anchor.web3.PublicKey => {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [REWARD_ENTRY_PREFIX, rewardPool.toBuffer(), stakeEntry.toBuffer()],
    programId,
  )[0];
};

export const deriveConfigPDA = (programId: anchor.web3.PublicKey): anchor.web3.PublicKey => {
  return anchor.web3.PublicKey.findProgramAddressSync([CONFIG_PREFIX], programId)[0];
};

export const deriveFeeValuePDA = (
  programId: anchor.web3.PublicKey,
  target: anchor.web3.PublicKey,
): anchor.web3.PublicKey => {
  return anchor.web3.PublicKey.findProgramAddressSync([FEE_VALUE_PREFIX, target.toBuffer()], programId)[0];
};

export const deriveMintMetadataPDA = (
  programId: anchor.web3.PublicKey,
  mint: anchor.web3.PublicKey,
): anchor.web3.PublicKey => {
  return anchor.web3.PublicKey.findProgramAddressSync(
    [METADATA_PREFIX, programId.toBuffer(), mint.toBuffer()],
    programId,
  )[0];
}; 