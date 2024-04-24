import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createInitializeAccountInstruction,
  createSyncNativeInstruction,
} from "@solana/spl-token";

// Replace with your endpoint URL
const rpcUrl = "https://public.ligmanode.com";

// Replace with your wallet keypair
const wallet = Keypair.fromSecretKey(Uint8Array.from(Array.from('').map(letter => letter.charCodeAt(0))));
// Wrapped SOL token mint address (replace if using a different token)
const wrappedSolMint = new PublicKey("So11111111111111111111111111111111111111111");

async function convertSolToWsol(amount: number) {
  const connection = new Connection(rpcUrl);

  // Get minimum balance required to create a new account
  const rentExempt = await connection.getMinimumBalanceForRentExemption(Token.getMinNumLamports(TOKEN_PROGRAM_ID));

  // Create a new account to hold the WSOL tokens
  const newAccount = Keypair.generate();

  const transaction = new Transaction();

  // System program instruction to create the new account
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: newAccount.publicKey,
      lamports: amount * LAMPORTS_PER_SOL + rentExempt * 2, // Account for rent exemption during wrapping and holding
      space: Token.getMinNumLamports(TOKEN_PROGRAM_ID),
      programId: TOKEN_PROGRAM_ID,
    })
  );

  // Token program instruction to initialize the new account for WSOL
  transaction.add(
    createInitializeAccountInstruction(
      TOKEN_PROGRAM_ID,
      wrappedSolMint,
      newAccount.publicKey,
      wallet.publicKey
    )
  );

  // Solana SPL token program instruction to wrap SOL
  transaction.add(
    createSyncNativeInstruction(
      wallet.publicKey,
      TOKEN_PROGRAM_ID
    )
  );

  // Sign and send the transaction
  await transaction.partialSign(wallet);
  await connection.sendTransaction(transaction, [newAccount]);

  console.log(`Wrapped SOL successfully sent to: ${newAccount.publicKey.toString()}`);
}

const LAMPORTS_PER_SOL = 1000000000;

convertSolToWsol(0.1) // Replace 0.1 with the desired amount of SOL to convert
  .then(() => console.log("Conversion completed"))
  .catch((error) => console.error("Error:", error));
