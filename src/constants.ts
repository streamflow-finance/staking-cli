import { FeeManager, Governor, RewardPool, RewardPoolDynamic, StakePool } from './types';

// Import IDL files
import FeeManagerIDL from '../idl/fee_manager.json';
import GovernorIDL from '../idl/governor.json';
import RewardPoolDynamicIDL from '../idl/reward_pool_dynamic.json';
import RewardPoolIDL from '../idl/reward_pool.json';
import StakePoolIDL from '../idl/stake_pool.json';

// Prefixes for PDA derivation
export const STAKE_ENTRY_PREFIX = Buffer.from('stake-entry', 'utf-8');
export const STAKE_POOL_PREFIX = Buffer.from('stake-pool', 'utf-8');
export const STAKE_MINT_PREFIX = Buffer.from('stake-mint', 'utf-8');
export const STAKE_VAULT_PREFIX = Buffer.from('stake-vault', 'utf-8');
export const LOOKUP_TABLE_PREFIX = Buffer.from('lookup-table', 'utf-8');
export const REWARD_POOL_PREFIX = Buffer.from('reward-pool', 'utf-8');
export const REWARD_VAULT_PREFIX = Buffer.from('reward-vault', 'utf-8');
export const REWARD_ENTRY_PREFIX = Buffer.from('reward-entry', 'utf-8');
export const CONFIG_PREFIX = Buffer.from('config', 'utf-8');
export const FEE_VALUE_PREFIX = Buffer.from('fee-value', 'utf-8');
export const METADATA_PREFIX = Buffer.from('metadata', 'utf-8');
export const GOVERNOR_PREFIX = Buffer.from('governor', 'utf-8');
export const PROPOSAL_PREFIX = Buffer.from('proposal', 'utf-8');
export const VOTE_PREFIX = Buffer.from('vote', 'utf-8');

// IDL exports with proper types
export const FEE_MANAGER_IDL = FeeManagerIDL as unknown as FeeManager;
export const GOVERNOR_IDL = GovernorIDL as unknown as Governor;
export const REWARD_POOL_IDL = RewardPoolIDL as unknown as RewardPool;
export const REWARD_POOL_DYNAMIC_IDL = RewardPoolDynamicIDL as unknown as RewardPoolDynamic;
export const STAKE_POOL_IDL = StakePoolIDL as unknown as StakePool; 