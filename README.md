# Harmony Tokens Subgraph

## Queries

## Interface Overviews

### Asset

```graphql
enum AssetType {
  TOKEN
  NFT
}

interface Asset {
  id: ID!
  type: AssetType!
  symbol: String!
  name: String!

  address: Bytes!

  events: [Event!]! @derivedFrom(field: "asset")
  eventCount: BigInt!
}
```

### Event

```graphql
enum EventType {
  TRANSFER
  BURN
  MINT
}

interface Event {
  id: ID!

  type: EventType!

  asset: Asset

  block: BigInt!
  timestamp: BigInt!
  transaction: Transaction!
}
```

### AccountAsset

```graphql
interface AccountAsset {
  id: ID!
  account: Account!
  asset: Asset!
  block: BigInt
  modified: BigInt
  transaction: Transaction
}
```

## Key Entity Overviews

#### Token

```graphql
type Token implements Asset @entity {
  id: ID!
  type: AssetType!
  address: Bytes!
  decimals: Int!
  name: String!
  symbol: String!
  eventCount: BigInt!
  burnEventCount: BigInt!
  mintEventCount: BigInt!
  transferEventCount: BigInt!
  totalSupply: BigDecimal!
  totalBurned: BigDecimal!
  totalMinted: BigDecimal!
  totalTransferred: BigDecimal!
  events: [Event!]! @derivedFrom(field: "asset")
  mints: [BurnEvent!]! @derivedFrom(field: "token")
  burns: [MintEvent!]! @derivedFrom(field: "token")
  transfers: [TransferEvent!]! @derivedFrom(field: "token")
}
```

#### Nft

```graphql
type Nft implements Asset @entity {
  id: ID!
  type: AssetType!
  address: Bytes!
  name: String!
  symbol: String!
  description: String
  eventCount: BigInt!
  burnEventCount: BigInt!
  mintEventCount: BigInt!
  transferEventCount: BigInt!
  totalSupply: BigInt!
  totalBurned: BigInt!
  totalMinted: BigInt!
  tokenIds: [BigInt!]!
  items: [NftItem!]! @derivedFrom(field: "token")
  events: [Event!]! @derivedFrom(field: "asset")
  mints: [NftBurnEvent!]! @derivedFrom(field: "token")
  burns: [NftMintEvent!]! @derivedFrom(field: "token")
  transfers: [NftTransferEvent!]! @derivedFrom(field: "token")
}

type NftItem @entity {
  id: ID!
  tokenUri: String!
  tokenId: BigInt!
  token: Nft!
  owner: Account
  ownerInventory: AccountInventory
  minter: Bytes
  burner: Bytes
  mint: NftMintEvent
  burn: NftBurnEvent
  eventCount: BigInt!
  transferEventCount: BigInt!
  transfers: [NftTransferEvent!]! @derivedFrom(field: "item")
}
```

#### Account

```graphql
type Account @entity {
  id: ID!
  address: Bytes!
  assets: [AccountAsset!]! @derivedFrom(field: "account")
  balances: [AccountBalance!]! @derivedFrom(field: "account")
  balancesSnapshots: [AccountBalanceSnapshot!]! @derivedFrom(field: "account")
  inventory: [AccountInventory!]! @derivedFrom(field: "account")
  inventorySnapshots: [AccountInventorySnapshot!]! @derivedFrom(field: "account")
}
```

#### Account Assets

```graphql
type AccountBalance implements AccountAsset @entity {
  id: ID!
  account: Account!
  asset: Asset!
  token: Token!
  amount: BigDecimal!
  block: BigInt
  modified: BigInt
  transaction: Transaction
}

type AccountInventory implements AccountAsset @entity {
  id: ID!
  account: Account!
  asset: Asset!
  token: Nft!
  tokenIds: [BigInt!]!
  items: [NftItem!]! @derivedFrom(field: "ownerInventory")
  block: BigInt
  modified: BigInt
  transaction: Transaction
}
```

#### Account Snapshots

```graphql
type AccountBalanceSnapshot @entity {
  id: ID!
  account: Account!
  token: Token!
  amount: BigDecimal!
  event: Event
  block: BigInt!
  timestamp: BigInt!
  transaction: Transaction!
}

type AccountInventorySnapshot @entity {
  id: ID!
  account: Account!
  token: Nft!
  tokenIds: [BigInt!]!
  event: Event
  block: BigInt!
  timestamp: BigInt!
  transaction: Transaction!
}
```

## Example Queries

### Querying all Assets

```graphql
{
  assets {
    id
    name
    symbol
    address
    eventCount
    ... on Token {
      totalSupply
      totalBurned
      totalMinted
    }
    ... on Nft {
      nftTotalSupply: totalSupply
      nftTotalBurned: totalBurned
      nftTotalMinted: totalMinted
      tokenIds
      items {
        tokenId
        tokenUri
        owner {
          id
        }
      }
    }
  }
}
```

### Querying all Events

```graphql
{
  events(orderBy: timestamp, orderDirection: desc) {
    id
    type
    asset {
      address
      symbol
      name
    }
    ... on MintEvent {
      minter
      amount
    }
    ... on BurnEvent {
      burner
      amount
    }
    ... on TransferEvent {
      sender
      destination
      amount
    }
    ... on NftMintEvent {
      minter
      tokenId
    }
    ... on NftBurnEvent {
      burner
      tokenId
    }
    ... on NftTransferEvent {
      sender
      destination
      tokenId
    }
  }
}
```

### Querying all Accounts

```graphql
{
  accounts {
    id
    assets {
      asset {
        type
        name
        symbol
      }

      ... on AccountBalance {
        amount
      }

      ... on AccountInventory {
        tokenIds
        items {
          id
          tokenId
          tokenUri
        }
      }
    }
  }

  accountBalanceSnapshots {
    token {
      symbol
    }
    amount
  }
  accountInventorySnapshots {
    token {
      symbol
    }
    tokenIds
  }
}
```
