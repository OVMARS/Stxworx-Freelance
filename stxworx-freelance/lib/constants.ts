export const CONTRACT_ADDRESS = 'STVNRH0FC9XJP8J18C92J09MNBS2BS2TW6RCAQ87';
export const CONTRACT_NAME = 'escrow-contract-v1';

export const NFT_CONTRACT_NAME = 'stxworx-v1';

// Grade tiers (must match contract constants)
export const GRADE_BRONZE = 1;
export const GRADE_SILVER = 2;
export const GRADE_GOLD = 3;
export const GRADE_PLATINUM = 4;

// IPFS CIDs for badge metadata (from badge-metadata/*.json)
export const BADGE_IPFS_CIDS: Record<number, string> = {
    [GRADE_BRONZE]: 'bafkreiexta26pt7otqljcabg63xgeuxwrc47xvvzkyg6apiikorzicocji',
    [GRADE_SILVER]: 'bafkreiab62y3qhjw4f4lxgrmzeu4dwnvinucclk5pxgfai7zux5be64qqu',
    [GRADE_GOLD]: 'bafkreigypd6chgczhuxbyijoqk62i3ejdhvb2n47qx5ppfqoyg3nknx6kq',
    [GRADE_PLATINUM]: 'Ybafkreibsr2ykk6jcook64ut36la3dsm2bdhah44nr4nvufccq5lvbvjczu',
};

export const VERIFIED_IPFS_CID = 'Ybafkreif5k2puqzgswwq2xyq3i33x5k7x4txa2zuwzzb5rv2jginpsr7gme';

export const SBTC_CONTRACT_ADDRESS = 'STVNRH0FC9XJP8J18C92J09MNBS2BS2TW6RCAQ87';
export const SBTC_CONTRACT_NAME = 'sbtc-token';
export const SBTC_ASSET_NAME = 'sbtc-token';

export const APP_CONFIG = {
    name: 'STXWorx Freelance',
    icon: '/vite.svg', // Default vite icon for now
};

export const IS_TESTNET = true;
