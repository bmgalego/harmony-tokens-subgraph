import { Bytes, BigInt } from "@graphprotocol/graph-ts";
import { Transfer } from "../../generated/templates/NFT/ERC721";
import {
  Nft,
  NftMintEvent,
  NftBurnEvent,
  NftTransferEvent,
} from "../../generated/schema";
import { ONE } from "../helpers/number";
import {
  addTokenToAccountInventory,
  getOrCreateAccount,
  removeTokenFromAccountInventory,
} from "./account";
import { loadNFT } from "../store";

const GENESIS_ADDRESS = "0x0000000000000000000000000000000000000000";

export function handleTransfer(event: Transfer): void {
  let token = loadNFT(event.address);

  if (token != null) {
    let tokenId = event.params.tokenId;

    let isBurn = event.params.to.toHex() == GENESIS_ADDRESS;
    let isMint = event.params.from.toHex() == GENESIS_ADDRESS;
    let isTransfer = !isBurn && !isMint;

    // Update token event logs
    let eventEntityId: string;

    if (isBurn) {
      let eventEntity = handleBurnEvent(
        token,
        tokenId,
        event.params.from,
        event
      );

      eventEntityId = eventEntity.id;
    } else if (isMint) {
      let eventEntity = handleMintEvent(token, tokenId, event.params.to, event);

      eventEntityId = eventEntity.id;
    } else if (isTransfer) {
      let eventEntity = handleTransferEvent(
        token,
        tokenId,
        event.params.from,
        event.params.to,
        event
      );

      eventEntityId = eventEntity.id;
    }

    // Updates balances of accounts
    if (isTransfer || isBurn) {
      let sourceAccount = getOrCreateAccount(event.params.from);

      let accountInventory = removeTokenFromAccountInventory(
        sourceAccount,
        token as Nft,
        tokenId
      );

      accountInventory.block = event.block.number;
      accountInventory.modified = event.block.timestamp;
      accountInventory.transaction = event.transaction.hash;

      sourceAccount.save();
      accountInventory.save();
    }

    if (isTransfer || isMint) {
      let destinationAccount = getOrCreateAccount(event.params.to);

      let accountBalance = addTokenToAccountInventory(
        destinationAccount,
        token as Nft,
        tokenId
      );
      accountBalance.block = event.block.number;
      accountBalance.modified = event.block.timestamp;
      accountBalance.transaction = event.transaction.hash;

      destinationAccount.save();
      accountBalance.save();
    }
  }
}

type TokenFilter = (value: BigInt, index: i32, array: BigInt[]) => boolean;

function createTokenFilter(tokenId: BigInt): TokenFilter {
  return (value: BigInt, index: i32, array: BigInt[]) => {
    return tokenId.notEqual(value);
  };
}

function handleBurnEvent(
  token: Nft | null,
  tokenId: BigInt,
  burner: Bytes,
  event: Transfer
): NftBurnEvent {
  let burnEvent = new NftBurnEvent(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  burnEvent.token = event.address.toHex();
  burnEvent.tokenId = tokenId;
  burnEvent.sender = event.transaction.from;
  burnEvent.burner = burner;

  burnEvent.block = event.block.number;
  burnEvent.timestamp = event.block.timestamp;
  burnEvent.transaction = event.transaction.hash;

  burnEvent.save();

  // Track total supply/burned
  if (token != null) {
    token.eventCount = token.eventCount.plus(ONE);
    token.burnEventCount = token.burnEventCount.plus(ONE);
    token.totalSupply = token.totalSupply.minus(ONE);
    token.totalBurned = token.totalBurned.plus(ONE);

    token.tokenIds = token.tokenIds.filter(
      createTokenFilter(event.params.tokenId)
    );

    token.save();
  }

  return burnEvent;
}

function handleMintEvent(
  token: Nft | null,
  tokenId: BigInt,
  destination: Bytes,
  event: Transfer
): NftMintEvent {
  let mintEvent = new NftMintEvent(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  mintEvent.token = event.address.toHex();
  mintEvent.tokenId = tokenId;
  mintEvent.sender = event.transaction.from;
  mintEvent.destination = destination;
  mintEvent.minter = event.transaction.from;

  mintEvent.block = event.block.number;
  mintEvent.timestamp = event.block.timestamp;
  mintEvent.transaction = event.transaction.hash;

  mintEvent.save();

  // Track total token supply/minted
  if (token != null) {
    token.eventCount = token.eventCount.plus(ONE);
    token.mintEventCount = token.mintEventCount.plus(ONE);
    token.totalSupply = token.totalSupply.plus(ONE);
    token.totalMinted = token.totalMinted.plus(ONE);

    let tokenIds = token.tokenIds;
    tokenIds.push(tokenId);
    token.tokenIds = tokenIds;
    token.save();
  }

  return mintEvent;
}

function handleTransferEvent(
  token: Nft | null,
  tokenId: BigInt,
  source: Bytes,
  destination: Bytes,
  event: Transfer
): NftTransferEvent {
  let transferEvent = new NftTransferEvent(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  transferEvent.token = event.address.toHex();
  transferEvent.tokenId = tokenId;
  transferEvent.sender = source;
  transferEvent.source = source;
  transferEvent.destination = destination;

  transferEvent.block = event.block.number;
  transferEvent.timestamp = event.block.timestamp;
  transferEvent.transaction = event.transaction.hash;

  transferEvent.save();

  // Track total token transferred
  if (token != null) {
    token.eventCount = token.eventCount.plus(ONE);
    token.transferEventCount = token.transferEventCount.plus(ONE);

    token.save();
  }

  return transferEvent;
}
