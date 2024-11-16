import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RoyaltyNft } from "../target/types/royalty_nft";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

describe("royalty nft", () => {
  const provider = anchor.AnchorProvider.env();
  const connectiobn = provider.connection;
  const wallet = provider.wallet as anchor.Wallet;
  anchor.setProvider(provider);

  const program = anchor.workspace.RoyaltyNft as Program<RoyaltyNft>;

  it("initiate contract", async () => {
    await program.methods
      .intializeContract()
      .accounts({
        payer: wallet.publicKey,
      })
      .rpc({ skipPreflight: true });
  });
});
