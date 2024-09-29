use crate::errors;
use crate::state::UserRoyaltyInfo;
use anchor_lang::prelude::*;
pub fn distribute_royalties(ctx: Context<DistributeRoyalties>, total_royalties: u64) -> Result<()> {
    // Proportional royalty distribution logic
    ctx.accounts
        .user_royalty_info
        .distribute_royalties(total_royalties)
}

#[derive(Accounts)]
pub struct DistributeRoyalties<'info> {
    #[account( init_if_needed,
     payer = user,
      seeds = [b"user_royalty", user.key().as_ref()],
      space = 8 + 1 + 4 + 4 + 4 ,
       bump)]
    pub user_royalty_info: Account<'info, UserRoyaltyInfo>,
    ///CHECK : this is safe because we dont read or write from this account
    pub nft_account: AccountInfo<'info>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
