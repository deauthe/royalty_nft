use crate::state::UserRoyaltyInfo;
use anchor_lang::prelude::*;
pub fn buy_shares(ctx: Context<BuyShares>, share_amount: u64) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct BuyShares<'info> {
    #[account(init_if_needed,
    payer = user,
    seeds = [b"user_royalty",mint.key().as_ref(), user.key().as_ref()],
    space = 8+1 + 8+8+8,
    bump)]
    pub user_royalty_info: Account<'info, UserRoyaltyInfo>,
    ///CHECK : this is safe because we dont read or write from this account
    pub mint: AccountInfo<'info>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}