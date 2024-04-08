import { EIP712, Erc20PermitToSign, IGelatoStruct } from './types';
import { TypedDataDomain, ethers } from 'ethers';
export declare const MAX_INT = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
export declare const POLYGON_USDC = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
export declare const getERC2612PermitTypeData: (provider: any, token: string | TypedDataDomain, owner: string, spender: string, amount: bigint, deadline?: bigint | undefined) => Promise<any>;
export declare function getSignERC20Permit(buyerAddress: string, paymentIntentResponse: any, provider: any): Promise<Erc20PermitToSign>;
export declare function buildPaymentTransaction(permitSignature: string, paymentIntentResponse: any, provider: any): Promise<EIP712<IGelatoStruct>>;
export declare function getPaymentTransactionSignatureData(wallet: ethers.Wallet, intent: any): Promise<{
    paymentTxSignature: string;
    permitTxSignature: string;
    metaTransactionDeadline: number;
}>;
