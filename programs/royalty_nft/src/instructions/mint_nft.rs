use anchor_lang::prelude::*;
use mpl_token_metadata::instructions;
use mpl_token_metadata::instructions::CreateMetadataAccountV3CpiAccounts;
use mpl_token_metadata::programs::MPL_TOKEN_METADATA_ID;
use mpl_token_metadata::types::Creator;
use anchor_spl::{token, associated_token};
use anchor_spl::{token::Token, associated_token::AssociatedToken};
use anchor_lang::system_program;
use instructions::{CreateMetadataAccountV3Cpi, CreateMetadataAccountV3InstructionArgs};
use mpl_token_metadata::types::DataV2;
use token::spl_token::instruction::AuthorityType;

use crate::state::ContractState;

pub fn mint_nft(ctx: Context<MintNft>,
    symbol: String,
    name: String,
    nft_uri: String,)-> Result<()>{

    msg!("creating mint account ...");
    msg!("mint :{}", &ctx.accounts.mint.key());
    system_program::create_account(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            system_program::CreateAccount {
                from: ctx.accounts.mint_authority.to_account_info(),
                to: ctx.accounts.mint.to_account_info(),
            },
        ),
        10000000,//rent exemption
        82, //default space for a token mint
        &ctx.accounts.token_program.key(),
    )?; //funding the new mint account, allocating space and making token program it's owner
    

    msg!("intialising mint account...");
    msg!("Mint: {}", &ctx.accounts.mint.key());
    token::initialize_mint(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::InitializeMint {
                mint: ctx.accounts.mint.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        0,
        &ctx.accounts.mint_authority.key(),
        Some(&ctx.accounts.mint_authority.key()),
    )?;
    // adding necessary information to the mint account like the mint_authority and the freeze authority

    msg!("Creating token account...");
    msg!("Token Address: {}", &ctx.accounts.token_account.key());    
    associated_token::create(
        CpiContext::new(
            ctx.accounts.associated_token_program.to_account_info(),
            associated_token::Create {
                payer: ctx.accounts.mint_authority.to_account_info(),
                associated_token: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),

            },
        ),
    )?;

    msg!("Minting token to token account...");
    msg!("Mint: {}", &ctx.accounts.mint.to_account_info().key());   
    msg!("Token Address: {}", &ctx.accounts.token_account.key());     
    token::mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
        ),
        1,
    )?;

    msg!("Creating metadata account...");
    msg!("Metadata account address: {}", &ctx.accounts.metadata.to_account_info().key());
    let rent = &ctx.accounts.rent.to_account_info();
    let cpi_accounts = CreateMetadataAccountV3CpiAccounts {
        rent: Some(rent),
        system_program: &ctx.accounts.system_program.to_account_info(),
        metadata: &ctx.accounts.metadata.to_account_info(),
        mint: &ctx.accounts.mint.to_account_info(),
        mint_authority: &ctx.accounts.mint_authority.to_account_info(),
        payer: &ctx.accounts.payer.to_account_info(),
        update_authority: (&ctx.accounts.update_authority.to_account_info(), true),
    };

    //Todo
    let creators = vec![
        Creator {
            address: ctx.accounts.payer.key(),
            verified: true,
            share: 70, // Full ownership to the payer
        },
        Creator {
            address: ctx.accounts.artist.key(),
            verified: true,
            share: 30,
        },
    ];

    let args = CreateMetadataAccountV3InstructionArgs {
        is_mutable: true,
        collection_details: None,
        data: DataV2 {
            name,
            symbol: symbol.to_string(),
            uri: nft_uri,
            seller_fee_basis_points: 500,
            collection: None,
            creators: Some(creators),
            uses: None,
        },
    };

    let ix = CreateMetadataAccountV3Cpi::new(
        &ctx.accounts.token_metadata_program.to_account_info(),
        cpi_accounts,
        args,
    ).invoke();

    msg!("Freezing mint Authority");
    let freeze_result = token::set_authority(CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::SetAuthority { current_authority: ctx.accounts.mint_authority.to_account_info(), account_or_mint: ctx.accounts.mint.to_account_info() }
    ), AuthorityType::MintTokens, None);

    match freeze_result { 
        Ok(_) => msg!("Mint authority has been frozen"),
        Err(e) => msg!("Error freezing mint authority: {:?}", e),
    }
    Ok(())
}

#[derive(Accounts)]
pub struct MintNft<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    ///CHECK : this is safe because we dont read or write from this account
    pub metadata: AccountInfo<'info>,

    ///CHECK : this is safe because we dont read or write from this account
    pub artist: AccountInfo<'info>,

    ///CHECK : this is safe because we dont read or write from this account
    pub mint: AccountInfo<'info>,
    ///CHECK : this is safe because we dont read or write from this account

    pub mint_authority: AccountInfo<'info>,
    ///CHECK : this is safe because we dont read or write from this account

    pub update_authority: AccountInfo<'info>,
    ///CHECK : this is safe because we dont read or write from this account

    #[account(address = MPL_TOKEN_METADATA_ID)]
    pub token_metadata_program: AccountInfo<'info>,
    ///CHECK : this is safe because we dont read or write from this account

    pub token_program: Program<'info,Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: We're about to create this with Anchor
    #[account(mut)]
    pub token_account: UncheckedAccount<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub contract_state: Account<'info, ContractState>,
}