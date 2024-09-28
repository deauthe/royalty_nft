import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RoyaltyNft } from "../target/types/royalty_nft";
import { PublicKey } from "@solana/web3.js";

const program = anchor.workspace.RoyaltyNft as Program<RoyaltyNft>;

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
	"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

describe("royalty_nft", () => {
	// Configure the client to use the local cluster.
	anchor.setProvider(anchor.AnchorProvider.env());

	it("initiate_state", async () => {
		const payer = anchor.AnchorProvider.env();
		const tx = await program.methods
			.intializeContract(172)
			.accounts({
				payer: payer.publicKey,
			})
			.rpc();
		console.log("Your transaction signature", tx);
	});

	it("mint nft!", async () => {
		const artistKeypair = anchor.web3.Keypair.generate();
		const contractStatePda = findContractStatePda();
		// Create payer account
		const payer = anchor.AnchorProvider.env();

		// Derive the mint address and the associated token account address

		const mintKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
		const ata = await anchor.utils.token.associatedAddress({
			mint: mintKeypair.publicKey,
			owner: payer.publicKey,
		});
		console.log(
			`New token: ${mintKeypair.publicKey}, new ata : ${ata.toString()}`
		);

		// Derive the metadata and master edition addresses

		const [metadataAddress, bump] =
			await anchor.web3.PublicKey.findProgramAddress(
				[
					Buffer.from("metadata"),
					TOKEN_METADATA_PROGRAM_ID.toBuffer(),
					mintKeypair.publicKey.toBuffer(),
				],
				TOKEN_METADATA_PROGRAM_ID
			);
		console.log(`Metadata address: ${metadataAddress.toString()}`);
		const tx = await program.methods
			.initializeNft("SYM", "name", "https://example.com/nft_uri")
			.accounts({
				payer: payer.publicKey,
				metadata: metadataAddress,
				artist: artistKeypair.publicKey,
				mint: mintKeypair.publicKey,
				mintAuthority: payer.publicKey,
				updateAuthority: payer.publicKey,
				tokenAccount: ata,
				contractState: contractStatePda,
			})
			.signers([artistKeypair, mintKeypair])
			.rpc();

		console.log("Your transaction signature", tx);
	});
});

function findContractStatePda() {
	// Define the seed for deriving the PDA
	const seed = Buffer.from("deauthe");

	// Derive the PDA
	const [contractStatePda, _bump] = PublicKey.findProgramAddressSync(
		[seed], // Pass the seed(s) as a Buffer array
		program.programId // Pass your program ID
	);

	console.log("Derived contract state PDA:", contractStatePda.toString());
	return contractStatePda;
}
