use anchor_lang::prelude::*;
use instructions::*;
pub mod errors;
pub mod instructions;
pub mod state;
declare_id!("GaMVToeXNUeCjzduQegv8tURziz9mCrbgtzUF6LFEx29");

#[program]
mod royalty_nft {
    use super::*;

    pub fn intialize_contract(ctx: Context<InitializeContract>, bump: u8) -> Result<()> {
        initialize_contract::intialize_contract(ctx, bump)
    }

    pub fn mint_nft(
        ctx: Context<MintNft>,
        symbol: String,
        name: String,
        nft_uri: String,
    ) -> Result<()> {
        instructions::mint_nft(ctx, symbol, name, nft_uri)
    }

    // 2. Buy shares of the NFT
    pub fn buy_shares(ctx: Context<BuyShares>, share_amount: u64) -> Result<()> {
        instructions::buy_shares(ctx, share_amount)
    }

    // 3. Distribute royalties
    pub fn distribute_royalties(
        ctx: Context<DistributeRoyalties>,
        total_royalties: u64,
    ) -> Result<()> {
        instructions::distribute_royalties(ctx, total_royalties)
    }

    // 4. Claim royalties
    pub fn claim_royalties(ctx: Context<ClaimRoyalties>) -> Result<()> {
        instructions::claim_royalties(ctx)
    }
}
