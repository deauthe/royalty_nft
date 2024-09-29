use anchor_lang::prelude::*;
#[account]
#[derive(InitSpace)]
pub struct UserRoyaltyInfo {
    pub bump: u8, //to push off curve and retrieve
    pub pending_royalties: u64,
    pub claimed_royalties: u64,
    pub total_shares: u64,
}

impl UserRoyaltyInfo {
    pub const SEED_PREFIX: &'static [u8] = b"user_royalty";

    pub fn add_royalty(&mut self, royalty: u64) {
        self.pending_royalties += royalty;
    }

    pub fn distribute_royalties(&mut self, total_royalties: u64) -> Result<()> {
        let share = self.total_shares;
        let pending = self.pending_royalties;
        let share_royalties = (pending * share) / total_royalties;
        self.claimed_royalties += share_royalties;
        self.pending_royalties -= share_royalties;
        Ok(())
    }

    pub fn add_shares(&mut self, share_amount: u64) -> Result<()> {
        self.total_shares += share_amount;
        Ok(())
    }
}
