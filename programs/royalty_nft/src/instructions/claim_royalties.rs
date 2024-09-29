use anchor_lang::prelude::*;
use crate::state::UserRoyaltyInfo;

pub fn claim_royalties(ctx: Context<ClaimRoyalties>) -> Result<()> {
    let pda = &mut ctx.accounts.user_royalty_info;
    let pending = pda.pending_royalties;
    // Logic to claim royalties
    pda.claimed_royalties += pending;
    pda.pending_royalties = 0;
    Ok(())
}

#[derive(Accounts)]
pub struct ClaimRoyalties<'info> {
    #[account(mut)]
    pub user_royalty_info: Account<'info, UserRoyaltyInfo>, //this is a pda derived with b"token" + "token_mint" + "my_program_id"
    pub user: Signer<'info>,
}
