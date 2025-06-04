import { toast } from 'sonner';
import type { UserCollection } from '@/lib/assetHubNFTManager';

export async function mintImageAsNFT({
  nftManager,
  selectedAccount,
  getInjector,
  selectedCollectionId,
  newCollectionName,
  imageUrl,
}: {
  nftManager: any;
  selectedAccount: { address: string };
  getInjector: (address: string) => Promise<any>;
  selectedCollectionId: string;
  newCollectionName: string;
  imageUrl: string;
}) {
  if (!selectedAccount) {
    toast.error('Wallet not connected');
    return null;
  }
  if (!nftManager) {
    toast.error('AssetHub not initialized');
    return null;
  }

  try {
    const injector = await getInjector(selectedAccount.address);
    if (!injector) throw new Error('Failed to get injector');

    let collectionId = selectedCollectionId;
    // create new collection if needed
    if (collectionId === 'new' || (!collectionId && newCollectionName.trim())) {
      const createResult = await nftManager.createCollection(
        selectedAccount.address,
        injector,
      );
      collectionId = createResult.collectionId;
      if (newCollectionName.trim()) {
        await nftManager.setCollectionMetadata(
          selectedAccount.address,
          injector,
          collectionId,
          JSON.stringify({ name: newCollectionName }),
        );
      }
    }

    const uploadRes = await fetch('/api/ipfs/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: imageUrl }),
    });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok)
      throw new Error(uploadData.error || 'IPFS upload failed');
    const ipfsUrl: string = uploadData.url;
    const ipfsHash = ipfsUrl.split('/ipfs/')[1]; // we use this for metadata

    const itemId = await nftManager.getNextItemId(collectionId);
    await nftManager.mintNFT(
      selectedAccount.address,
      injector,
      collectionId,
      itemId,
      selectedAccount.address,
    );

    await nftManager.setNFTMetadata(
      selectedAccount.address,
      injector,
      collectionId,
      itemId,
      JSON.stringify({ image: `ipfs://${ipfsHash}` }),
    );

    toast.success(
      `NFT minted in collection ${collectionId} with item ID ${itemId}`,
    );

    return { collectionId, itemId };
  } catch (e: any) {
    console.error('Minting error:', e);
    toast.error(e.message || 'Error minting NFT');
    return null;
  }
}

export async function getUserCollections(
  nftManager: any,
  userAddress: string,
): Promise<UserCollection[]> {
  try {
    const collections = await nftManager.getUserCollections(userAddress);
    return collections;
  } catch (e) {
    console.error('Error fetching collections:', e);
    return [];
  }
}
