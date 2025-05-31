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

  constructor(wsEndpoint = 'wss://asset-hub-paseo-rpc.dwellir.com') {
    this.wsEndpoint = wsEndpoint;
  }

  async initialize(): Promise<ApiPromise> {
    if (this.api) return this.api;

    try {
      const wsProvider = new WsProvider(this.wsEndpoint);
      this.api = await ApiPromise.create({ provider: wsProvider });

      console.log('Connected to AssetHub:', this.wsEndpoint);
      console.log('Chain info:', {
        name: (await this.api.rpc.system.chain()).toString(),
        version: (await this.api.rpc.system.version()).toString(),
        nodeVersion: (await this.api.rpc.system.name()).toString(),
      });

      return this.api;
    } catch (error) {
      console.error('Failed to initialize AssetHub connection:', error);
      throw new Error(
        `Failed to connect to AssetHub: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getUserNFTs(userAddress: string): Promise<UserNFT[]> {
    if (!this.api)
      throw new Error('API not initialized. Call initialize() first.');

    try {
      console.log('Fetching NFTs for user:', userAddress);

      const userNFTs = await this.api.query.nfts.account.entries(userAddress);

      if (userNFTs.length === 0) {
        console.log('No NFTs found for user');
        return [];
      }

      const nftList: UserNFT[] = [];

      for (const [
        {
          args: [account, collectionId, itemId],
        },
        value,
      ] of userNFTs) {
        try {
          const itemDetails = await this.api.query.nfts.item(
            collectionId,
            itemId,
          );
          const itemMetadata = await this.api.query.nfts.itemMetadataOf(
            collectionId,
            itemId,
          );
          const collectionMetadata =
            await this.api.query.nfts.collectionMetadataOf(collectionId);

          nftList.push({
            collection: collectionId.toString(),
            item: itemId.toString(),
            owner: account.toString(),
            itemDetails: itemDetails.toJSON(),
            itemMetadata: itemMetadata.toJSON(),
            collectionMetadata: collectionMetadata.toJSON(),
          });
        } catch (error) {
          console.warn(
            `Failed to fetch details for NFT ${collectionId}:${itemId}:`,
            error,
          );
        }
      }

      console.log(`Found ${nftList.length} NFTs for user`);
      console.log(nftList);
      return nftList;
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      throw new Error(
        `Failed to fetch NFTs: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getUserCollections(userAddress: string): Promise<UserCollection[]> {
    if (!this.api)
      throw new Error('API not initialized. Call initialize() first.');

    try {
      console.log('Fetching collections for user:', userAddress);

      const collections =
        await this.api.query.nfts.collectionAccount.entries(userAddress);

      if (collections.length === 0) {
        console.log('No collections found for user');
        return [];
      }

      const collectionList: UserCollection[] = [];

      for (const [
        {
          args: [account, collectionId],
        },
        value,
      ] of collections) {
        try {
          const collectionDetails =
            await this.api.query.nfts.collection(collectionId);
          const collectionMetadata =
            await this.api.query.nfts.collectionMetadataOf(collectionId);

          collectionList.push({
            id: collectionId.toString(),
            owner: account.toString(),
            details: collectionDetails.toJSON(),
            metadata: collectionMetadata.toJSON(),
          });
        } catch (error) {
          console.warn(
            `Failed to fetch details for collection ${collectionId}:`,
            error,
          );
        }
      }

      console.log(`Found ${collectionList.length} collections for user`);
      return collectionList;
    } catch (error) {
      console.error('Error fetching user collections:', error);
      throw new Error(
        `Failed to fetch collections: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async signAndSendTransaction(
    tx: SubmittableExtrinsic<'promise', ISubmittableResult>,
    senderAddress: string,
    injector: InjectedExtension,
  ): Promise<TransactionResult> {
    return new Promise((resolve, reject) => {
      console.log('Signing and sending transaction...');

      tx.signAndSend(
        senderAddress,
        { signer: injector.signer },
        ({ status, events, dispatchError, txHash }) => {
          console.log('Transaction status:', status.type);

          if (dispatchError) {
            if (dispatchError.isModule && this.api) {
              const decoded = this.api.registry.findMetaError(
                dispatchError.asModule,
              );
              const errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
              console.error(
                'Transaction failed with module error:',
                errorMessage,
              );
              reject(new Error(errorMessage));
            } else {
              const errorMessage = dispatchError.toString();
              console.error('Transaction failed:', errorMessage);
              reject(new Error(errorMessage));
            }
          } else if (status.isInBlock) {
            console.log(
              'Transaction included in block:',
              status.asInBlock.toString(),
            );
            resolve({
              blockHash: status.asInBlock.toString(),
              txHash: txHash.toString(),
              events: events.map((e) => e.event.toJSON()),
            });
          } else if (status.isFinalized) {
            console.log(
              'Transaction finalized:',
              status.asFinalized.toString(),
            );
            resolve({
              blockHash: status.asFinalized.toString(),
              txHash: txHash.toString(),
              events: events.map((e) => e.event.toJSON()),
            });
          }
        },
      ).catch((error) => {
        console.error('Transaction signing failed:', error);
        reject(error);
      });
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

    try {
      console.log('Creating collection with config:', {
        maxSupply,
        mintSettings,
      });

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

      const collectionEvent = result.events.find(
        (event: any) => event.section === 'nfts' && event.method === 'Created',
      );

      if (!collectionEvent) {
        throw new Error(
          'Collection creation event not found in transaction events',
        );
      }

      const collectionId = collectionEvent.data[0].toString();
      console.log('Collection created successfully with ID:', collectionId);

      return {
        ...result,
        collectionId,
      };
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
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

    try {
      console.log('Minting NFT:', { collectionId, itemId, mintTo });

      const tx = this.api.tx.nfts.mint(
        collectionId,
        itemId,
        mintTo,
        witnessData,
      );

      const result = await this.signAndSendTransaction(
        tx,
        issuerAddress,
        injector,
      );

      const mintEvent = result.events.find(
        (event: any) => event.section === 'nfts' && event.method === 'Issued',
      );

      if (!mintEvent) {
        throw new Error('NFT mint event not found in transaction events');
      }

      console.log('NFT minted successfully');

      return {
        ...result,
        collectionId: mintEvent.data[0].toString(),
        itemId: mintEvent.data[1].toString(),
        owner: mintEvent.data[2].toString(),
      };
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
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

    try {
      console.log('Setting NFT metadata:', { collectionId, itemId });

      const tx = this.api.tx.nfts.setMetadata(collectionId, itemId, metadata);
      return await this.signAndSendTransaction(tx, ownerAddress, injector);
    } catch (error) {
      console.error('Error setting NFT metadata:', error);
      throw error;
    }
  }

  async setCollectionMetadata(
    ownerAddress: string,
    injector: InjectedExtension,
    collectionId: string | number,
    metadata: string,
  ): Promise<TransactionResult> {
    if (!this.api)
      throw new Error('API not initialized. Call initialize() first.');

    try {
      console.log('Setting collection metadata:', { collectionId });

      const tx = this.api.tx.nfts.setCollectionMetadata(collectionId, metadata);
      return await this.signAndSendTransaction(tx, ownerAddress, injector);
    } catch (error) {
      console.error('Error setting collection metadata:', error);
      throw error;
    }
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

    try {
      console.log('Transferring NFT:', {
        collectionId,
        itemId,
        from: fromAddress,
        to: toAddress,
      });

      const tx = this.api.tx.nfts.transfer(collectionId, itemId, toAddress);
      return await this.signAndSendTransaction(tx, fromAddress, injector);
    } catch (error) {
      console.error('Error transferring NFT:', error);
      throw error;
    }
  }

  async getNextCollectionId(): Promise<string> {
    if (!this.api)
      throw new Error('API not initialized. Call initialize() first.');

    const nextId = await this.api.query.nfts.nextCollectionId();
    return nextId.toString();
  }

  isConnected(): boolean {
    return this.api?.isConnected || false;
  }

  async disconnect(): Promise<void> {
    if (this.api) {
      console.log('Disconnecting from AssetHub...');
      await this.api.disconnect();
      this.api = null;
    }
  }
}
