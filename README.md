# Blockus Non-custodial payments.

## getSignERC20Permit:

This function is responsible for generating permit data required for ERC-2612 (permit) token transactions. It prepares the necessary information for a user to delegate token transfers to another entity (blockus distribution contract).

```js
const permitTypeData = await getSignERC20Permit(
    buyersAddress,
    paymentIntent,
    signer

const permitSignature = await signer.signTypedData(
    permitTypeData.domain,
    permitTypeData.types,
    permitTypeData.value,
);
```

## buildPaymentTransaction:

This function constructs a meta transaction for payment purposes. A meta transaction is a transaction that's signed off-chain and then relayed to the blockchain by a third party. In this context, buildPaymentTransaction assembles the data needed to execute a payment, including details such as the permit signature (from getSignERC20Permit), the intent of the payment. This meta transaction allows for decentralized applications to interact with users without requiring them to directly cover the transaction fees in Ether.

```js
const paymentMetaTransaction:EIP712<IGelatoStruct> = await buildPaymentTransaction(
    permitSignature, // Permit type data signature 
    paymentIntent, 
    signer
);
```


## Ethers JS.

EtherJS v6 is the only dependency needed, it is used to instantiate Signers, provider objects and generate the required signatures. In the context of the web browser metamask will be both signer and provider.

```js
// Web browser
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// NodeJS
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC, 137);
const wallet = new ethers.Wallet(privateKey, provider);
const buyersAddress = await wallet.getAddress();
```

Signatures will prompt users to sign through a pop up when the signer is metamask or another web base wallet. Objects being sign are Typed structured park of the EIP-712.

```js
const signature = await signer.signTypedData(
    typeData.domain,
    typeData.types,
    typeData.value,
);
```

## Usage

This is meant to be soon an SDK, and you will be able to import the needed functions. In the mean time code can be copied or used are reference. Important code is within the `index.ts` and `gelato.ts` files.

```js
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const buyersAddress = await signer.getAddress();

// GETS PAYMENT INTENTION FROM BLOCKUS
const listingId = 'arqB2clzH46oehy59eXIc4PNHFKA';
const paymentIntent = await blockus.getPaymentIntent(listingId);

// Creates permit type data
const permitTypeData = await getSignERC20Permit(
    buyersAddress,
    intent,
    signer
);

// Get permit signature 
const permitSignature = await signer.signTypedData(
    permitTypeData.domain,
    permitTypeData.types,
    permitTypeData.value,
);      

// Constructs payment transaction
const paymentMetaTransaction:EIP712<IGelatoStruct> = await buildPaymentTransaction(
    permitSignature,
    intent,
    signer
);

// Sign meta transaction for token distribution.
const distributeTokenSignature = await signer.signTypedData(
    paymentMetaTransaction.domain,
    paymentMetaTransaction.types,
    paymentMetaTransaction.value,
);

// Meta transaction deadline
const metaTxDeadline = paymentMetaTransaction.value.userDeadline;

// Execute listing
const body = {
    "paymentWalletChain": "polygon",
    "paymentWalletAddress": buyersAddress,
    "paymentTxSignature": distributeTokenSignature,
    "permitTxSignature": permitSignature,
    "metaTransactionDeadline": metaTxDeadline
}

axios.post(`${blockusEndpoint}/v1/marketplace/listings/${listingId}/execute`, body)
  .then((response) => {
    console.log('Response:', response.data);
  })

```

## Further Reading
https://eips.ethereum.org/EIPS/eip-712

https://eips.ethereum.org/EIPS/eip-2612