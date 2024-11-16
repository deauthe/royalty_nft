
# Setup

```zsh
yarn install
anchor build
anchor deploy
anchor test
```

### if you run into some problems here are some links I visited while going through the code
[anchor-test-cant-start-validator-but-solana-test-validator-works-fine](https://solana.stackexchange.com/questions/5596/anchor-test-cant-start-validator-but-solana-test-validator-works-fine)
[anchor-test-error-your-configured-rpc-port-8899-is-already-in-use](https://solana.stackexchange.com/questions/3117/anchor-test-error-your-configured-rpc-port-8899-is-already-in-use)


# contract docs
### Difference between minting and creating

| Aspect                | Creating an NFT                          | Minting an NFT                           |
| --------------------- | ---------------------------------------- | ---------------------------------------- |
| **Focus**             | Defining metadata and initializing mint  | Generating and assigning the token       |
| **Ownership**         | No ownership established yet             | Token ownership is assigned              |
| **Blockchain Action** | Setting up metadata and the mint account | Minting tokens and sending to an address |
| **State**             | Conceptual existence                     | Tangible existence as a token            |
# functions
## `initialize_contract(ctx)`

intializes `contract_state` account :
	total_items: `u64`
	bump: `u8`

## `create_nft(ctx, symbol, name, uri)`

**Purpose**: Define the metadata and initialize the NFT's presence on the blockchain.
#### **Parameters**:
- `ctx`: A `Context<CreateNft>` that contains accounts and other context-specific data.
- `name`: A `String` representing the name of the NFT.
- `symbol`: A `String` representing the symbol of the NFT.
- `uri`: A `String` containing the URI to the metadata of the NFT (e.g., hosted on IPFS).

#### **Associated Accounts**:
- `payer`: The wallet initiating and paying for the transaction.
- `mint`: The SPL mint account for the NFT.
- `metadata`: The account holding the NFT's metadata.
- `edition_account`: The master edition account for the NFT.
- `token_account`: The account holding the minted NFT.
- `royalty_pool_account`: The account managing royalties associated with the NFT.
- `contract_state`: The global state account for the contract.
- `rent`, `system_program`, `token_program`, `token_metadata_program`: System and program accounts required for CPI calls.

#### **Steps**:

1. **Initialize the Mint Account**:

    - Creates an SPL token mint with 0 decimals to represent the NFT.
    - Sets the payer as the mint authority and freeze authority.
2. **Create Metadata Account**:

    - Generates metadata for the NFT using the `mpl_token_metadata` program.
    - Includes properties like `name`, `symbol`, `uri`, and `creators`.
    - Ensures metadata is immutable.
3. **Mint the NFT**:

    - Mints a single token (supply = 1) to the payer's token account.
4. **Create Master Edition Account**:

    - Creates a master edition for the NFT, setting `max_supply` to 1.
    - Links the master edition with the metadata.
5. **Update Contract State**:

    - Updates the contract state to reflect the addition of the newly created NFT

**Key Actions**:
- **Metadata Creation**: Setting up details such as the NFT's name, symbol, description, image URI, royalties, creators, and other properties.
- **Token Mint Creation**: Setting up the mint account on the blockchain to represent the NFT. This defines the NFT's unique identifier (mint address) and prepares it for ownership transfer or distribution.

## `mint_nft`
#### **Purpose**:

The `mint_nft` program handles minting an existing NFT (created by another program like `create_nft`) to a specified user’s token account. This function ensures that a single NFT token is minted and transferred to the recipient's account.

#### **Parameters**:

- `ctx`: A `Context<MintNft>` containing the accounts and necessary permissions for minting.
- `amount`: A `u64` value representing the number of tokens to mint (for NFTs, this should always be `1`).

#### **Steps**:

1. **Mint Tokens**:
    - Uses the `mint_to` CPI call from the SPL Token program to mint the specified `amount` of tokens (NFTs have a fixed supply of 1 per mint).
2. **Verify Mint Success**:
    - Logs a success message upon successful minting or an error message if the mint operation fails.
#### **Associated Accounts**:

- `mint`: The SPL token mint account associated with the NFT.
- `token_account`: The recipient's token account where the minted NFT will be transferred.
- `mint_authority`: The account with permission to mint tokens (typically the original creator).
- `payer`: The account paying for the transaction fees.
- `token_program`: The SPL token program used for minting operations.
- `system_program`: The Solana system program required for system-level operations.

## **`buy_shares`**

#### **Purpose**:

The `buy_shares` program allows users to purchase fractional shares of an NFT's royalty pool. This updates the user's royalty information and increases their share ownership for the associated NFT.

---

#### **Parameters**:

- `ctx`: A `Context<BuyShares>` that contains all accounts and permissions required for this instruction.
- `share_amount`: A `u64` value specifying the number of shares the user wants to buy.

---

#### **Steps**:

1. **Retrieve User's Royalty Info**:

    - Create the `user_royalty_info` account that stores the user's current royalty information for **that particular nft**.
2. **Add Shares**:

    - Call the `add_shares` method on the `user_royalty_info` account to increase the user's share count by the specified `share_amount`.
    - If the `add_shares` method returns an error, return a `CustomError::AddShares`.
3. **Confirm Transaction**:

    - If successful, complete the function execution and log the results.

---

#### **Associated Accounts**:

- `user_royalty_info`: An account representing the royalty information for a specific user, linked to the NFT's mint and the user's public key. This account stores:
    - The total number of shares owned by the user.
    - Pending royalties.
    - Claimed royalties.
- `mint`: The mint account of the NFT for which royalties are being purchased.
- `user`: The user's signer account initiating the transaction.
- `system_program`: The Solana system program to handle account initialization and updates.
Here’s a summary of the `add_royalties_to_pool` function:

---

## `add_royalties_to_pool`

1. **Purpose:**
   - Adds a specified amount of SOL to a royalty pool account (PDA) associated with an NFT.
   - Starts a new distribution epoch for royalty payouts.

2. **Steps:**
   - Transfers SOL from the admin account to the RoyaltyPool PDA using a Cross-Program Invocation (CPI) to the System Program.
   - Increments the current royalty distribution epoch (`current_epoch`).
   - Appends the new royalty amount to the list of royalties for the current epoch (`royalties_per_epoch`).
   - Updates the total royalties accumulated and the current SOL balance of the royalty pool.

3. **Accounts:**
   - **`royalty_pool_account`**: PDA storing royalty-related data, derived using a seed and the mint address.
   - **`mint`**: NFT mint associated with the royalty pool (used only for deriving the PDA).
   - **`admin`**: Account providing the SOL (must be a signer).
   - **`system_program`**: Program facilitating the SOL transfer.

4. **Result:**
   - Successfully adds SOL to the royalty pool and prepares for the next royalty distribution.
