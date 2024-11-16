import { startAnchor } from "anchor-bankrun";
import { PublicKey } from "@solana/web3.js";
import { BankrunProvider } from "anchor-bankrun";
import { RoyaltyNft } from "../target/types/royalty_nft";
import { Program } from "@coral-xyz/anchor";
import { expect, describe, test, beforeEach } from "@jest/globals";

import * as anchor from "@coral-xyz/anchor";
import { Console, log } from "console";

const ROYALTY_PROGRAM_ID = new PublicKey(
  "BQ7VPNzn8Ha9EH1u2tPrJ6TN9VawRacUFiUFoQrzi2oJ"
);
describe("royalty_nft", () => {
  let context;
  let provider: BankrunProvider;
  let program: Program<RoyaltyNft>;
  let payer: anchor.Wallet;

  test("initiate contract", async () => {
    console.log("intializing contract");
    context = await startAnchor("./", [], []);
    provider = new BankrunProvider(context);

    program = anchor.workspace.RoyaltyNft as Program<RoyaltyNft>;
    payer = provider.wallet;
  });

  test("create_nft", async () => {
    console.log("payer is", payer.publicKey.toBase58());
    console.log("program is", program.programId.toBase58());

    context = await startAnchor("./", [], []);
    provider = new BankrunProvider(context);

    program = anchor.workspace.RoyaltyNft as Program<RoyaltyNft>;
    payer = provider.wallet;

    const [mintPda, mintPdaBump] = await PublicKey.findProgramAddress(
      [Buffer.from("mint")],
      program.programId
    );

    const [tokenAccountPda, tokenAccountBump] =
      await PublicKey.findProgramAddress(
        [
          payer.publicKey.toBuffer(),
          program.programId.toBuffer(),
          mintPda.toBuffer(),
        ],
        anchor.utils.token.TOKEN_PROGRAM_ID
      );
    console.log("mintPda", mintPda.toBase58());
    console.log("tokenAccountPda", tokenAccountPda.toBase58());
    try {
      const tx = await program.methods
        .createNft("SYM", "test-token", "test-uri")
        .accounts({
          payer: payer.publicKey,
          mint: mintPda,
          tokenAccount: tokenAccountPda,
        })
        .rpc({ skipPreflight: true });
      expect(tx).toBeDefined();
    } catch (err) {
      console.error("Transaction failed", err);
      throw err;
    }
  }, 100000);
});
