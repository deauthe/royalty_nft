import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RoyaltyNft } from "../target/types/royalty_nft";
import { PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import {} from "@solana/spl-token";

const program = anchor.workspace.RoyaltyNft as Program<RoyaltyNft>;

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
	"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
const TOKEN_PROGRAM_ID = anchor.utils.token.TOKEN_PROGRAM_ID;

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
		const payer = anchor.AnchorProvider.env().wallet;
		const connection = anchor.AnchorProvider.env().connection;

		// Derive the mint address and the associated token account address

		const mintKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
		const [masterEditionPda, _masterBump] =
			await anchor.web3.PublicKey.findProgramAddress(
				[
					Buffer.from("metadata"),
					TOKEN_METADATA_PROGRAM_ID.toBuffer(),
					mintKeypair.publicKey.toBuffer(),
					Buffer.from("edition"),
				],
				TOKEN_METADATA_PROGRAM_ID
			);
		const ata = await anchor.utils.token.associatedAddress({
			mint: mintKeypair.publicKey,
			owner: payer.publicKey,
		});
		console.log(
			`mint account: ${
				mintKeypair.publicKey
			}, new ata : ${ata.toString()}, payer : ${payer.publicKey}`
		);
		console.log(
			"artist : ",
			artistKeypair.publicKey.toString(),
			"mint : ",
			mintKeypair.publicKey.toString(),
			"user :",
			payer.publicKey.toString(),
			"contract :"
		);

		const [mintAuthorityPda, _bump] =
			await anchor.web3.PublicKey.findProgramAddress(
				[Buffer.from("mint_authority_seed")], // You can customize the seed
				program.programId
			);
		// Derive the metadata and master edition addresses

		const [metadataPda, bump] = await anchor.web3.PublicKey.findProgramAddress(
			[
				Buffer.from("metadata"),
				TOKEN_METADATA_PROGRAM_ID.toBuffer(),
				mintKeypair.publicKey.toBuffer(),
			],
			TOKEN_METADATA_PROGRAM_ID
		);

		console.log(
			`Metadata address: ${metadataPda.toString()}, 
      master edition: ${masterEditionPda.toString()},
       mintAuthority: ${mintAuthorityPda.toString()},
       programId: ${program.programId.toString()},
    tokenMetadataProgramId: ${TOKEN_METADATA_PROGRAM_ID.toString()}`
		);
		const tx = await program.methods
			.mintNft("SYM", "name", "https://example.com/nft_uri")
			.accounts({
				payer: payer.publicKey,
				metadata: metadataPda,
				artist: artistKeypair.publicKey,
				mint: mintKeypair.publicKey,
				masterEdition: masterEditionPda,
				tokenAccount: ata,
			})
			.signers([mintKeypair])
			.rpc();

		// const signature = await sendAndConfirmTransaction(connection, tx, [
		// 	mintKeypair,
		// ]);
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
