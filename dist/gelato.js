"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGaslessTxToSign = exports.getGelatoRequestStruct = exports.DEFAULT_DEADLINE_GAP = exports.EIP712_SPONSORED_CALL_ERC2771_TYPE_DATA = exports.GELATO_RELAY_ADDRESS = exports.gelatoEIP712DomainTypeData = void 0;
const ethers_1 = require("ethers");
const gelato_abi_1 = __importDefault(require("./gelato-abi"));
function gelatoEIP712DomainTypeData(chain) {
    return {
        name: 'GelatoRelay1BalanceERC2771',
        version: '1',
        verifyingContract: exports.GELATO_RELAY_ADDRESS,
        chainId: chain,
    };
}
exports.gelatoEIP712DomainTypeData = gelatoEIP712DomainTypeData;
exports.GELATO_RELAY_ADDRESS = '0xd8253782c45a12053594b9deB72d8e8aB2Fca54c';
exports.EIP712_SPONSORED_CALL_ERC2771_TYPE_DATA = {
    SponsoredCallERC2771: [
        { name: 'chainId', type: 'uint256' },
        { name: 'target', type: 'address' },
        { name: 'data', type: 'bytes' },
        { name: 'user', type: 'address' },
        { name: 'userNonce', type: 'uint256' },
        { name: 'userDeadline', type: 'uint256' },
    ],
};
exports.DEFAULT_DEADLINE_GAP = 86400;
async function getGelatoRequestStruct(provider, chainId, target, metaTxToSign, deadline) {
    const signerAddress = await provider.getAddress();
    const relayerAddress = exports.GELATO_RELAY_ADDRESS;
    const gelatoRelayerContract = new ethers_1.Contract(relayerAddress, gelato_abi_1.default);
    const contract = gelatoRelayerContract.connect(provider);
    const userNonce = await contract.userNonce(await provider.getAddress());
    let data;
    try {
        const iface = new ethers_1.ethers.utils.Interface([metaTxToSign.func]);
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
        userDeadline: deadline ?? calculateDeadline(exports.DEFAULT_DEADLINE_GAP),
    };
    return gelatoRequestStruct;
}
exports.getGelatoRequestStruct = getGelatoRequestStruct;
exports.getGaslessTxToSign = async (chain, contractAddress, provider, metaTxToSign, deadline) => {
    const domain = gelatoEIP712DomainTypeData(chain);
    const types = { ...exports.EIP712_SPONSORED_CALL_ERC2771_TYPE_DATA };
    const value = await getGelatoRequestStruct(provider, chain, contractAddress, metaTxToSign, deadline);
    return { domain, types, value };
};
function calculateDeadline(gap) {
    return Math.floor(Date.now() / 1000) + gap;
}
//# sourceMappingURL=gelato.js.map