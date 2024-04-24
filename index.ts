import { Connection, Keypair, SystemProgram, Transaction, VersionedTransaction } from "@solana/web3.js";
import { NATIVE_MINT, createSyncNativeInstruction, createAssociatedTokenAccount } from "@solana/spl-token";
import { decode } from "bs58";
import 'dotenv/config'

const privateKey = process.env.PRIVATE_KEY != undefined ? process.env.PRIVATE_KEY : '';
const rpcUrl = process.env.RPC_URL != undefined ? process.env.RPC_URL : '';
const wallet = Keypair.fromSecretKey(decode(privateKey));
const LAMPORTS_PER_SOL = 1000000000;
async function convertSolToWsol(amount: number) {
  const connection = new Connection(rpcUrl);
  const latestBlockhash = await connection.getLatestBlockhash({
    commitment: 'finalized',
  });

  let associatedTokenAccount = await createAssociatedTokenAccount(
    connection,
    wallet,
    NATIVE_MINT,
    wallet.publicKey,
  );

  let transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: associatedTokenAccount,
      lamports: amount,
    }),
    createSyncNativeInstruction(associatedTokenAccount)
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

let amt = LAMPORTS_PER_SOL * 0.001
convertSolToWsol(amt)
  .then(() => console.log("Conversion completed"))
  .catch((error) => console.error("Error:", error));
