import { EIP712, IGelatoStruct } from './types';
export declare function gelatoEIP712DomainTypeData(chain: number): {
    name: string;
    version: string;
    verifyingContract: string;
    chainId: number;
};
export declare const GELATO_RELAY_ADDRESS = "0xd8253782c45a12053594b9deB72d8e8aB2Fca54c";
export declare const EIP712_SPONSORED_CALL_ERC2771_TYPE_DATA: {
    SponsoredCallERC2771: {
        name: string;
        type: string;
    }[];
};
export declare const DEFAULT_DEADLINE_GAP = 86400;
export declare function getGelatoRequestStruct(provider: any, chainId: number, target: string, metaTxToSign: {
    functionName: string;
    func: string;
    parameters: any[];
}, deadline?: number): Promise<IGelatoStruct>;
export declare const getGaslessTxToSign: (chain: number, contractAddress: string, provider: any, metaTxToSign: {
    functionName: string;
    func: string;
    parameters: any[];
}, deadline?: number | undefined) => Promise<EIP712<IGelatoStruct>>;
