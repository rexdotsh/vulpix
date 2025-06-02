import { ApiPromise, WsProvider } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { InjectedExtension } from '@polkadot/extension-inject/types';
import type { ISubmittableResult } from '@polkadot/types/types';

export interface NFTCollectionConfig {
  maxSupply?: number | null;
  mintSettings?: {
    mintType: 'Issuer' | 'Public' | 'HolderOf';
    price?: string | null;
    startBlock?: number | null;
    endBlock?: number | null;
  };
}

export interface TransactionResult {
  blockHash: string;
  txHash: string;
  events: any[];
}

export interface CollectionCreatedResult extends TransactionResult {
  collectionId: string;
}

export interface NFTMintedResult extends TransactionResult {
  collectionId: string;
  itemId: string;
  owner: string;
}

export interface UserNFT {
  collection: string;
  item: string;
  owner: string;
  itemDetails: any;
  itemMetadata: any;
  collectionMetadata: any;
}

export interface UserCollection {
  id: string;
  owner: string;
  details: any;
  metadata: any;
}

export class AssetHubNFTManager {
  private api: ApiPromise | null = null;
  private wsEndpoint: string;

  constructor(wsEndpoint = 'wss://testnet-passet-hub.polkadot.io') {
    this.wsEndpoint = wsEndpoint;
  }

  async initialize(): Promise<ApiPromise> {
    if (this.api) return this.api;

    try {
      const wsProvider = new WsProvider(this.wsEndpoint);
      this.api = await ApiPromise.create({ provider: wsProvider });
      return this.api;
    } catch (error) {
      throw new Error(
        `Failed to connect to AssetHub: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getUserNFTs(userAddress: string): Promise<UserNFT[]> {
    if (!this.api)
      throw new Error('API not initialized. Call initialize() first.');

    const userNFTs = await this.api.query.nfts.account.entries(userAddress);
    if (userNFTs.length === 0) return [];

    const nftList: UserNFT[] = [];

    for (const [
      {
        args: [account, collectionId, itemId],
      },
    ] of userNFTs) {
      try {
        const [itemDetails, itemMetadata, collectionMetadata] =
          await Promise.all([
            this.api.query.nfts.item(collectionId, itemId),
            this.api.query.nfts.itemMetadataOf(collectionId, itemId),
            this.api.query.nfts.collectionMetadataOf(collectionId),
          ]);

        nftList.push({
          collection: collectionId.toString(),
          item: itemId.toString(),
          owner: account.toString(),
          itemDetails: itemDetails.toJSON(),
          itemMetadata: itemMetadata.toJSON(),
          collectionMetadata: collectionMetadata.toJSON(),
        });
      } catch (error) {
        console.error('Failed to get NFT details:', error);
      }
    }

    return nftList;
  }

  async getUserCollections(userAddress: string): Promise<UserCollection[]> {
    if (!this.api)
      throw new Error('API not initialized. Call initialize() first.');

    const collections =
      await this.api.query.nfts.collectionAccount.entries(userAddress);
    if (collections.length === 0) return [];

    const collectionList: UserCollection[] = [];

    for (const [
      {
        args: [account, collectionId],
      },
    ] of collections) {
      try {
        const [collectionDetails, collectionMetadata] = await Promise.all([
          this.api.query.nfts.collection(collectionId),
          this.api.query.nfts.collectionMetadataOf(collectionId),
        ]);

        collectionList.push({
          id: collectionId.toString(),
          owner: account.toString(),
          details: collectionDetails.toJSON(),
          metadata: collectionMetadata.toJSON(),
        });
      } catch (error) {
        console.error('Failed to get collection details:', error);
      }
    }

    return collectionList;
  }

  private signAndSendTransaction(
    tx: SubmittableExtrinsic<'promise', ISubmittableResult>,
    senderAddress: string,
    injector: InjectedExtension,
  ): Promise<TransactionResult> {
    return new Promise((resolve, reject) => {
      tx.signAndSend(
        senderAddress,
        { signer: injector.signer },
        ({ status, events, dispatchError, txHash }) => {
          if (dispatchError) {
            const errorMessage =
              this.api && dispatchError.isModule
                ? (() => {
                    const decoded = this.api.registry.findMetaError(
                      dispatchError.asModule,
                    );
                    return `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
                  })()
                : dispatchError.toString();
            reject(new Error(errorMessage));
          } else if (status.isInBlock || status.isFinalized) {
            resolve({
              blockHash: (status.isInBlock
                ? status.asInBlock
                : status.asFinalized
              ).toString(),
              txHash: txHash.toString(),
              events: events.map((e) => e.event.toJSON()),
            });
          }
        },
      ).catch(reject);
    });
  }

  async createCollection(
    creatorAddress: string,
    injector: InjectedExtension,
    config: NFTCollectionConfig = {},
  ): Promise<CollectionCreatedResult> {
    if (!this.api)
      throw new Error('API not initialized. Call initialize() first.');

    const {
      maxSupply = null,
      mintSettings = {
        mintType: 'Issuer',
        price: null,
        startBlock: null,
        endBlock: null,
      },
    } = config;

    // pre-fetch the next collection ID so we can return it to the user
    const nextId = await this.getNextCollectionId();
    const tx = this.api.tx.nfts.create(creatorAddress, {
      settings: 0,
      maxSupply,
      mintSettings: {
        mintType: { [mintSettings.mintType]: null },
        price: mintSettings.price,
        startBlock: mintSettings.startBlock,
        endBlock: mintSettings.endBlock,
        defaultItemSettings: 0,
      },
    });

    const result = await this.signAndSendTransaction(
      tx,
      creatorAddress,
      injector,
    );

    return {
      ...result,
      collectionId: nextId,
    };
  }

  async mintNFT(
    issuerAddress: string,
    injector: InjectedExtension,
    collectionId: string | number,
    itemId: string | number,
    mintTo: string,
    witnessData: any = null,
  ): Promise<NFTMintedResult> {
    if (!this.api)
      throw new Error('API not initialized. Call initialize() first.');

    const tx = this.api.tx.nfts.mint(collectionId, itemId, mintTo, witnessData);
    const result = await this.signAndSendTransaction(
      tx,
      issuerAddress,
      injector,
    );

    return {
      ...result,
      collectionId: collectionId.toString(),
      itemId: itemId.toString(),
      owner: mintTo,
    };
  }

  async setNFTMetadata(
    ownerAddress: string,
    injector: InjectedExtension,
    collectionId: string | number,
    itemId: string | number,
    metadata: string,
  ): Promise<TransactionResult> {
    if (!this.api)
      throw new Error('API not initialized. Call initialize() first.');
    const tx = this.api.tx.nfts.setMetadata(collectionId, itemId, metadata);
    return this.signAndSendTransaction(tx, ownerAddress, injector);
  }

  async setCollectionMetadata(
    ownerAddress: string,
    injector: InjectedExtension,
    collectionId: string | number,
    metadata: string,
  ): Promise<TransactionResult> {
    if (!this.api)
      throw new Error('API not initialized. Call initialize() first.');
    const tx = this.api.tx.nfts.setCollectionMetadata(collectionId, metadata);
    return this.signAndSendTransaction(tx, ownerAddress, injector);
  }

  async transferNFT(
    fromAddress: string,
    injector: InjectedExtension,
    collectionId: string | number,
    itemId: string | number,
    toAddress: string,
  ): Promise<TransactionResult> {
    if (!this.api)
      throw new Error('API not initialized. Call initialize() first.');
    const tx = this.api.tx.nfts.transfer(collectionId, itemId, toAddress);
    return this.signAndSendTransaction(tx, fromAddress, injector);
  }

  async burnNFT(
    ownerAddress: string,
    injector: InjectedExtension,
    collectionId: string | number,
    itemId: string | number,
  ): Promise<TransactionResult> {
    if (!this.api)
      throw new Error('API not initialized. Call initialize() first.');
    const tx = this.api.tx.nfts.burn(collectionId, itemId);
    return this.signAndSendTransaction(tx, ownerAddress, injector);
  }

  async getNextCollectionId(): Promise<string> {
    if (!this.api)
      throw new Error('API not initialized. Call initialize() first.');
    const nextId = await this.api.query.nfts.nextCollectionId();
    return nextId.toString();
  }

  async getNextItemId(_collectionId: string | number): Promise<string> {
    // Random u32: ignore on-chain state for now
    const randomId = Math.floor(Math.random() * (2 ** 32 - 1));
    return randomId.toString();
  }

  isConnected(): boolean {
    return this.api?.isConnected || false;
  }

  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
    }
  }
}
