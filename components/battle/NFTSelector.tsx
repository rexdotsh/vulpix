'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { NFTStatsDisplay } from './NFTStatsDisplay';
import { decodeHexMetadata } from '@/lib/utils';

interface NFTSelectorProps {
  nfts: any[];
  selectedNFT: any;
  onNFTSelect: (nft: any) => void;
  isReady: boolean;
  onReadyToggle: () => void;
  disabled?: boolean;
  canBeReady?: boolean;
}

export function NFTSelector({
  nfts,
  selectedNFT,
  onNFTSelect,
  isReady,
  onReadyToggle,
  disabled = false,
  canBeReady = true,
}: NFTSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="nft-select" className="text-sm font-medium mb-2 block">
          Select Your NFT
        </label>
        {!nfts || nfts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No NFTs available. Please mint some NFTs first.
          </p>
        ) : (
          <Select
            value={
              selectedNFT ? `${selectedNFT.collection}-${selectedNFT.item}` : ''
            }
            onValueChange={(value) => {
              const nft = nfts.find(
                (n) => `${n.collection}-${n.item}` === value,
              );
              if (nft) onNFTSelect(nft);
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose an NFT" />
            </SelectTrigger>
            <SelectContent>
              {nfts.map((nft) => {
                const metadata = decodeHexMetadata(nft.itemMetadata?.data);
                return (
                  <SelectItem
                    key={`${nft.collection}-${nft.item}`}
                    value={`${nft.collection}-${nft.item}`}
                  >
                    {metadata?.name || `Item #${nft.item}`} (Collection:{' '}
                    {nft.collection.slice(0, 8)}...)
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedNFT && (
        <div>
          <h4 className="text-sm font-medium mb-2">Battle Stats</h4>
          <NFTStatsDisplay stats={selectedNFT.stats} />
        </div>
      )}

      <Button
        onClick={onReadyToggle}
        disabled={!selectedNFT || disabled || !canBeReady}
        variant={isReady ? 'default' : 'outline'}
        className="w-full"
      >
        {isReady
          ? 'Ready!'
          : !canBeReady
            ? 'Complete wallet setup first'
            : 'Mark as Ready'}
      </Button>
    </div>
  );
}
