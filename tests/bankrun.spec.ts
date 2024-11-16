import { startAnchor } from "anchor-bankrun";
import { PublicKey } from "@solana/web3.js";
import { BankrunProvider } from "anchor-bankrun";
import { RoyaltyNft } from "../target/types/royalty_nft";
import { Program } from "@coral-xyz/anchor";
import { expect, describe, test } from "@jest/globals";
import * as anchor from "@coral-xyz/anchor";

const ROYALTY_PROGRAM_ID = new PublicKey(
  "BQ7VPNzn8Ha9EH1u2tPrJ6TN9VawRacUFiUFoQrzi2oJ"
);
describe("royalty_nft", () => {
  test("initiate contract", async () => {
    console.log("intializing contract");
    let context = await startAnchor("./", [], []);
    let provider = new BankrunProvider(context);

    let program = anchor.workspace.RoyaltyNft as Program<RoyaltyNft>;
    let payer = provider.wallet;

    try {
      const tx = await program.methods
        .intializeContract()
        .accounts({
          payer: payer.publicKey,
        })
        .rpc({ skipPreflight: true });
      expect(tx).toBeDefined();
    } catch (err) {
      console.error("Transaction failed", err);
      throw err;
    }
  });

  test("create_nft", async () => {
    let context = await startAnchor("./", [], []);
    let provider = new BankrunProvider(context);

    let program = anchor.workspace.RoyaltyNft as Program<RoyaltyNft>;
    let payer = provider.wallet;

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
  });
});
