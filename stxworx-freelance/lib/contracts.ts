import { openContractCall } from '@stacks/connect';
import { STACKS_TESTNET } from '@stacks/network';
import {
    uintCV,
    standardPrincipalCV,
    contractPrincipalCV,
    PostConditionMode,
    StandardPrincipalCV,
    UIntCV,
    ContractPrincipalCV
} from '@stacks/transactions';
import { APP_CONFIG } from './constants'; // You might need to adjust this import based on your storage

// --- Configuration ---
// STX Address: STVNRH0FC9XJP8J18C92J09MNBS2BS2TW6RCAQ87
// Contract Name: escrow-multi-token-v4

const CONTRACT_ADDRESS = 'STVNRH0FC9XJP8J18C92J09MNBS2BS2TW6RCAQ87';
const CONTRACT_NAME = 'escrow-multi-token-v4';

interface ProjectData {
    freelancerAddress: string;
    totalBudget: number; // In Tokens (e.g. 100 STX)
    tokenType: 'STX' | 'sBTC';
    milestones: { amount: number }[]; // Array of exactly 4 milestone objects with 'amount' in Tokens
}

export const createProjectContractCall = async (
    data: ProjectData,
    onFinish: (data: any) => void,
    onCancel: () => void
) => {

    // 1. Calculate Micro-Units
    // STX = 6 decimals (1,000,000)
    // sBTC = 8 decimals (100,000,000)
    const decimals = data.tokenType === 'STX' ? 1000000 : 100000000;

    // Helper to safely convert and round
    const toMicro = (amount: number) => Math.floor(amount * decimals);

    // M1, M2, M3, M4 amounts
    // We assume data.milestones has 4 items. If less, we pad with 0.
    const m1 = data.milestones[0] ? toMicro(data.milestones[0].amount) : 0;
    const m2 = data.milestones[1] ? toMicro(data.milestones[1].amount) : 0;
    const m3 = data.milestones[2] ? toMicro(data.milestones[2].amount) : 0;
    const m4 = data.milestones[3] ? toMicro(data.milestones[3].amount) : 0;

    const functionName = data.tokenType === 'STX'
        ? 'create-project-stx'
        : 'create-project-sbtc';

    const functionArgs: (StandardPrincipalCV | UIntCV | ContractPrincipalCV)[] = [
        standardPrincipalCV(data.freelancerAddress),
        uintCV(m1),
        uintCV(m2),
        uintCV(m3),
        uintCV(m4),
    ];

    // If sBTC, we need to pass the trait reference
    if (data.tokenType === 'sBTC') {
        // TODO: Replace with actual sBTC token contract for Testnet
        // For now using a placeholder or common testnet sip-010
        // Example: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sbtc-token'
        const sbtcContract = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
        const sbtcName = 'sbtc-token';
        functionArgs.push(contractPrincipalCV(sbtcContract, sbtcName));
    }

    await openContractCall({
        network: STACKS_TESTNET,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName,
        functionArgs,
        postConditionMode: PostConditionMode.Allow, // Allow for now, should be specific in prod
        onFinish,
        onCancel,
        appDetails: {
            name: 'STX Worx',
            icon: window.location.origin + '/logo.png',
        },
    });
};

export const saveProjectToBackend = async (txId: string, formData: any) => {
    try {
        const response = await fetch('http://localhost:3001/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                txId,
                clientAddress: formData.clientAddress, // Make sure to pass this from frontend
                freelancerAddress: formData.freelancerAddress,
                title: formData.title,
                description: formData.description,
                category: formData.category,
                totalBudget: formData.totalBudget,
                tokenType: formData.tokenType,
                milestones: formData.milestones
            }),
        });
        return await response.json();
    } catch (error) {
        console.error('Failed to save project to backend:', error);
        throw error;
    }
};
