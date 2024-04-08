(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('ethers')) :
    typeof define === 'function' && define.amd ? define(['exports', 'ethers'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global["blockus-eth-payment"] = {}, global.ethers));
})(this, (function (exports, ethers) { 'use strict';

    var gelatoAbi = [
        {
            inputs: [{ internalType: 'address', name: '_gelato', type: 'address' }],
            stateMutability: 'nonpayable',
            type: 'constructor',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'sponsor',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'target',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'feeToken',
                    type: 'address',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'oneBalanceChainId',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'nativeToFeeTokenXRateNumerator',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'nativeToFeeTokenXRateDenominator',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    internalType: 'bytes32',
                    name: 'correlationId',
                    type: 'bytes32',
                },
            ],
            name: 'LogUseGelato1Balance',
            type: 'event',
        },
        {
            inputs: [],
            name: 'DOMAIN_SEPARATOR',
            outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'SPONSORED_CALL_ERC2771_TYPEHASH',
            outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'gelato',
            outputs: [{ internalType: 'address', name: '', type: 'address' }],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'name',
            outputs: [{ internalType: 'string', name: '', type: 'string' }],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [
                {
                    components: [
                        { internalType: 'uint256', name: 'chainId', type: 'uint256' },
                        { internalType: 'address', name: 'target', type: 'address' },
                        { internalType: 'bytes', name: 'data', type: 'bytes' },
                        { internalType: 'address', name: 'user', type: 'address' },
                        { internalType: 'uint256', name: 'userNonce', type: 'uint256' },
                        { internalType: 'uint256', name: 'userDeadline', type: 'uint256' },
                    ],
                    internalType: 'struct CallWithERC2771',
                    name: '_call',
                    type: 'tuple',
                },
                { internalType: 'address', name: '_sponsor', type: 'address' },
                { internalType: 'address', name: '_feeToken', type: 'address' },
                {
                    internalType: 'uint256',
                    name: '_oneBalanceChainId',
                    type: 'uint256',
                },
                { internalType: 'bytes', name: '_userSignature', type: 'bytes' },
                {
                    internalType: 'uint256',
                    name: '_nativeToFeeTokenXRateNumerator',
                    type: 'uint256',
                },
                {
                    internalType: 'uint256',
                    name: '_nativeToFeeTokenXRateDenominator',
                    type: 'uint256',
                },
                { internalType: 'bytes32', name: '_correlationId', type: 'bytes32' },
            ],
            name: 'sponsoredCallERC2771',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [{ internalType: 'address', name: '', type: 'address' }],
            name: 'userNonce',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'version',
            outputs: [{ internalType: 'string', name: '', type: 'string' }],
            stateMutability: 'view',
            type: 'function',
        },
    ];

    function gelatoEIP712DomainTypeData(chain) {
        return {
            name: 'GelatoRelay1BalanceERC2771',
            version: '1',
            verifyingContract: GELATO_RELAY_ADDRESS,
            chainId: chain,
        };
    }
    const GELATO_RELAY_ADDRESS = '0xd8253782c45a12053594b9deB72d8e8aB2Fca54c';
    const EIP712_SPONSORED_CALL_ERC2771_TYPE_DATA = {
        SponsoredCallERC2771: [
            { name: 'chainId', type: 'uint256' },
            { name: 'target', type: 'address' },
            { name: 'data', type: 'bytes' },
            { name: 'user', type: 'address' },
            { name: 'userNonce', type: 'uint256' },
            { name: 'userDeadline', type: 'uint256' },
        ],
    };
    const DEFAULT_DEADLINE_GAP = 86400;
    async function getGelatoRequestStruct(provider, chainId, target, metaTxToSign, deadline) {
        const signerAddress = await provider.getAddress();
        const relayerAddress = GELATO_RELAY_ADDRESS;
        const gelatoRelayerContract = new ethers.Contract(relayerAddress, gelatoAbi);
        const contract = gelatoRelayerContract.connect(provider);
        const userNonce = await contract.userNonce(await provider.getAddress());
        let data;
        try {
            const iface = new ethers.ethers.utils.Interface([metaTxToSign.func]);
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
    const getGaslessTxToSign = async (chain, contractAddress, provider, metaTxToSign, deadline) => {
        const domain = gelatoEIP712DomainTypeData(chain);
        const types = { ...EIP712_SPONSORED_CALL_ERC2771_TYPE_DATA };
        const value = await getGelatoRequestStruct(provider, chain, contractAddress, metaTxToSign, deadline);
        return { domain, types, value };
    };
    function calculateDeadline(gap) {
        return Math.floor(Date.now() / 1000) + gap;
    }

    const MAX_INT = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const POLYGON_USDC = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
    const ERC20_PERMIT_TYPE = {
        Permit: [
            {
                name: 'owner',
                type: 'address',
            },
            {
                name: 'spender',
                type: 'address',
            },
            {
                name: 'value',
                type: 'uint256',
            },
            {
                name: 'nonce',
                type: 'uint256',
            },
            {
                name: 'deadline',
                type: 'uint256',
            },
        ],
    };
    const ERC20_PERMIT_ABI_INTERFACE = [
        'function EIP712_VERSION() view returns (string)',
        'function nonces(address) view returns (uint256)',
        'function name() view returns (string)',
    ];
    const getERC2612PermitTypeData = async (provider, token, owner, spender, amount, deadline) => {
        const tokenAddress = token.verifyingContract || token;
        const contract = new ethers.ethers.Contract(tokenAddress, ERC20_PERMIT_ABI_INTERFACE, provider);
        const [nonce, name, chainId] = await Promise.all([
            contract.nonces(owner),
            contract.name(),
            137,
        ]);
        let version;
        try {
            version = await contract.EIP712_VERSION();
        }
        catch (error) {
            // DEV: Polygon USDC requires version 2 for EIP712_VERSION 
            // If using a custom token please make sure it supports permit and set the appropriate version number 
            if (tokenAddress === POLYGON_USDC) {
                version = '2';
            }
            else {
                version = '1';
            }
        }
        const types = ERC20_PERMIT_TYPE;
        const value = {
            owner,
            spender,
            value: amount,
            nonce,
            deadline,
        };
        const domain = {
            name,
            version,
            chainId,
            verifyingContract: tokenAddress,
        };
        const erc20PermitToSign = {
            domain,
            types,
            value,
        };
        return erc20PermitToSign;
    };
    async function getSignERC20Permit(buyerAddress, paymentIntentResponse, provider) {
        const contractAddress = paymentIntentResponse.contractAddress;
        const deadline = paymentIntentResponse.parameters['deadline'];
        const tokenAddress = paymentIntentResponse.parameters['paymentTokenAddress'];
        const amount = paymentIntentResponse.parameters['totalPrice'];
        if (!amount)
            throw new Error("No Amount set");
        const typeData = await getERC2612PermitTypeData(provider, tokenAddress, buyerAddress, contractAddress, amount, deadline);
        const permitType = { Permit: typeData.types.Permit };
        return { domain: typeData.domain, types: permitType, value: typeData.value };
    }
    async function buildPaymentTransaction(permitSignature, paymentIntentResponse, provider) {
        const contractAddress = paymentIntentResponse.contractAddress;
        const functionName = paymentIntentResponse.functionName;
        const func = paymentIntentResponse.functionSignature;
        const chain = paymentIntentResponse.chain;
        const chainId = chainInfo[chain].chainId;
        const splitPermitSignature = ethers.ethers.utils.splitSignature(permitSignature);
        const permitTransactionParams = [
            splitPermitSignature.v,
            splitPermitSignature.r,
            splitPermitSignature.s,
        ];
        const orderPropertiesToExtract = [
            'paymentTokenAddress',
            'fromAddress',
            'transfers',
            'totalPrice',
            'deadline',
        ];
        const distributionParams = [];
        orderPropertiesToExtract.forEach(key => {
            // Check if the property exists in the object
            if (paymentIntentResponse.parameters.hasOwnProperty(key)) {
                // Retrieve the value and push it into the orderedParams array
                distributionParams.push(paymentIntentResponse.parameters[key]);
            }
        });
        const functionCall = { functionName, func, parameters: [...distributionParams, ...permitTransactionParams] };
        return getGaslessTxToSign(chainId, contractAddress, provider, functionCall);
    }
    async function getPaymentTransactionSignatureData(wallet, intent) {
        const buyersAddress = await wallet.getAddress();
        const permitTypeData = await getSignERC20Permit(buyersAddress, intent, wallet);
        const permitTxSignature = await wallet._signTypedData(permitTypeData.domain, permitTypeData.types, permitTypeData.value);
        const paymentMetaTransaction = await buildPaymentTransaction(permitTxSignature, intent, wallet);
        // Sign meta transaction for token distribution.
        const paymentTxSignature = await wallet._signTypedData(paymentMetaTransaction.domain, paymentMetaTransaction.types, paymentMetaTransaction.value);
        const metaTransactionDeadline = paymentMetaTransaction.value.userDeadline;
        return { paymentTxSignature, permitTxSignature, metaTransactionDeadline };
    }
    const chainInfo = {
        'polygon': {
            chainId: 137
        }
    };

    exports.MAX_INT = MAX_INT;
    exports.POLYGON_USDC = POLYGON_USDC;
    exports.buildPaymentTransaction = buildPaymentTransaction;
    exports.getERC2612PermitTypeData = getERC2612PermitTypeData;
    exports.getPaymentTransactionSignatureData = getPaymentTransactionSignatureData;
    exports.getSignERC20Permit = getSignERC20Permit;

}));
