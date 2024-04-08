import { Contract, ethers } from 'ethers';
import gelatoAbi from './gelato-abi';
export function gelatoEIP712DomainTypeData(chain) {
    return {
        name: 'GelatoRelay1BalanceERC2771',
        version: '1',
        verifyingContract: GELATO_RELAY_ADDRESS,
        chainId: chain,
    };
}
export const GELATO_RELAY_ADDRESS = '0xd8253782c45a12053594b9deB72d8e8aB2Fca54c';
export const EIP712_SPONSORED_CALL_ERC2771_TYPE_DATA = {
    SponsoredCallERC2771: [
        { name: 'chainId', type: 'uint256' },
        { name: 'target', type: 'address' },
        { name: 'data', type: 'bytes' },
        { name: 'user', type: 'address' },
        { name: 'userNonce', type: 'uint256' },
        { name: 'userDeadline', type: 'uint256' },
    ],
};
export const DEFAULT_DEADLINE_GAP = 86400;
export async function getGelatoRequestStruct(provider, chainId, target, metaTxToSign, deadline) {
    const signerAddress = await provider.getAddress();
    const relayerAddress = GELATO_RELAY_ADDRESS;
    const gelatoRelayerContract = new Contract(relayerAddress, gelatoAbi);
    const contract = gelatoRelayerContract.connect(provider);
    const userNonce = await contract.userNonce(await provider.getAddress());
    let data;
    try {
        const iface = new ethers.utils.Interface([metaTxToSign.func]);
        data = iface.encodeFunctionData(metaTxToSign.functionName, metaTxToSign.parameters);
    }
    catch (e) {
        console.log(e);
        throw new Error('could not create data');
    }
    const gelatoRequestStruct = {
        chainId,
        target: target,
        data: data,
        user: signerAddress,
        userNonce: Number(userNonce),
        userDeadline: deadline ?? calculateDeadline(DEFAULT_DEADLINE_GAP),
    };
    return gelatoRequestStruct;
}
export const getGaslessTxToSign = async (chain, contractAddress, provider, metaTxToSign, deadline) => {
    const domain = gelatoEIP712DomainTypeData(chain);
    const types = { ...EIP712_SPONSORED_CALL_ERC2771_TYPE_DATA };
    const value = await getGelatoRequestStruct(provider, chain, contractAddress, metaTxToSign, deadline);
    return { domain, types, value };
};
function calculateDeadline(gap) {
    return Math.floor(Date.now() / 1000) + gap;
}
