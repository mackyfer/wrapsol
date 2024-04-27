import { Connection, Keypair,  SystemProgram, Transaction, VersionedTransaction, clusterApiUrl } from "@solana/web3.js";
import { NATIVE_MINT, createSyncNativeInstruction, ASSOCIATED_TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { decode } from "bs58";
import 'dotenv/config'

const privateKey = process.env.PRIVATE_KEY != undefined ? process.env.PRIVATE_KEY : '';
const rpcUrl = process.env.RPC_URL != undefined ? process.env.RPC_URL : '';
const wallet = Keypair.fromSecretKey(decode(privateKey));
const LAMPORTS_PER_SOL = 1000000000;
async function convertSolToWsol(amount: number) {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
 
  const latestBlockhash = await connection.getLatestBlockhash({
    commitment: 'confirmed',
  });

  let associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    NATIVE_MINT,
    wallet.publicKey
  )

  let transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: associatedTokenAccount.address,
      lamports: amount,
    }),
    createSyncNativeInstruction(associatedTokenAccount.address)
  );

  transaction.recentBlockhash = latestBlockhash.blockhash
  transaction.feePayer = wallet.publicKey
  const serializedTransaction = transaction.serialize({ requireAllSignatures: false, verifySignatures: true });
  const transactionBase64 = serializedTransaction.toString('base64');

  const recoveredTransaction = getRawTransaction(transactionBase64);
  if (recoveredTransaction instanceof VersionedTransaction) {
    recoveredTransaction.sign([wallet]);
  } else {
    recoveredTransaction.partialSign(wallet);
  }
  const txnSignature = await connection.sendRawTransaction(recoveredTransaction.serialize());

  console.log(`Wrapped SOL successfully: Signature: ${txnSignature}`);
}

function getRawTransaction(
  encodedTransaction: string
): Transaction | VersionedTransaction {
  let recoveredTransaction: Transaction | VersionedTransaction;
  try {
    recoveredTransaction = Transaction.from(
      Buffer.from(encodedTransaction, 'base64')
    );
  } catch (error) {
    recoveredTransaction = VersionedTransaction.deserialize(
      Buffer.from(encodedTransaction, 'base64')
    );
  }
  return recoveredTransaction;
}

<<<<<<< HEAD
let amt = LAMPORTS_PER_SOL * 0.1 //change this value to the amount of SOL you want to be converted to WSOL
=======
let amt = LAMPORTS_PER_SOL * 0.001 //change this value to the amount of SOL you want to be converted to WSOL
>>>>>>> b171fe0ad9b439c6d61fbd46f2e37a7339ce115d
convertSolToWsol(amt)
  .then(() => console.log("Conversion completed"))
  .catch((error) => console.error("Error:", error));