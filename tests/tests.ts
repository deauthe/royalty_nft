import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RoyaltyNft } from "../target/types/royalty_nft";
import { Keypair, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import {
	createMint,
	getAccount,
	getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import {} from "@solana/spl-token";
import { assert } from "chai";

const program = anchor.workspace.RoyaltyNft as Program<RoyaltyNft>;

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
	"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
const TOKEN_PROGRAM_ID = anchor.utils.token.TOKEN_PROGRAM_ID;
const payer = Keypair.generate();

before(async () => {
	// Airdrop SOL to the payer
	await anchor.AnchorProvider.env().connection.requestAirdrop(
		payer.publicKey,
		2 * anchor.web3.LAMPORTS_PER_SOL
	);
});

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

	it("create nft", async () => {
		const connection = anchor.AnchorProvider.env().connection;
		const mint = await createMint(
			connection,
			payer,
			payer.publicKey,
			payer.publicKey,
			0
		);

		const usertokenAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			payer,
			mint,
			payer.publicKey
		);

		const tx = program.methods
			.createNft("Who", "how", "https://idk.com/image1.jpg")
			.accounts({
				mint: "",
				payer: payer.publicKey,
				tokenAccount: usertokenAccount.address,
			})
			.signers([payer])
			.rpc();

		//check if metadata account got created
		const [metadataAccount] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("metadata"),
				TOKEN_METADATA_PROGRAM_ID.toBuffer(),
				mint.toBuffer(),
			],
			TOKEN_METADATA_PROGRAM_ID
		);

		const [masterEditionAccount] = PublicKey.findProgramAddressSync(
			[
				Buffer.from("metadata"),
				TOKEN_METADATA_PROGRAM_ID.toBuffer(),
				mint.toBuffer(),
				Buffer.from("edition"),
			],
			TOKEN_METADATA_PROGRAM_ID
		);

		const metadataAccountInfo = await connection.getAccountInfo(
			metadataAccount
		);
		assert.ok(metadataAccountInfo !== null);

		const editionAccountInfo = await connection.getAccountInfo(
			masterEditionAccount
		);
		assert.ok(editionAccountInfo !== null);

		const tokenAccountInfo = await getAccount(
			connection,
			usertokenAccount.address
		);
		assert.ok(tokenAccountInfo.amount === BigInt(1));
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
