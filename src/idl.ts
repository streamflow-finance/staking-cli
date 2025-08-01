import * as anchor from '@coral-xyz/anchor';
import { Provider } from '@coral-xyz/anchor';
import {
  FEE_MANAGER_IDL,
  GOVERNOR_IDL,
  REWARD_POOL_DYNAMIC_IDL,
  REWARD_POOL_IDL,
  STAKE_POOL_IDL,
} from './constants';

export const buildFeeManagerProgram = (provider: Provider): any =>
  new anchor.Program(FEE_MANAGER_IDL, provider);
export const buildRewardProgram = (provider: Provider): any =>
  new anchor.Program(REWARD_POOL_IDL, provider);
export const buildRewardDynamicProgram = (provider: Provider): any =>
  new anchor.Program(REWARD_POOL_DYNAMIC_IDL, provider);
export const buildGovernorProgram = (provider: Provider): any =>
  new anchor.Program(GOVERNOR_IDL, provider);
export const buildStakeProgram = (provider: Provider): any =>
  new anchor.Program(STAKE_POOL_IDL, provider); 