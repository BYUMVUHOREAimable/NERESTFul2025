const crypto = require("crypto");

/**
 * Generates a blockchain transaction hash for a transaction
 * This is a simplified simulation of blockchain integration
 * In a real-world application, this would interact with an actual blockchain
 *
 * @param {Object} transaction - The transaction object
 * @returns {string} - The generated blockchain hash
 */
const generateTransactionHash = (transaction) => {
  try {
    // Create a string representation of the transaction data
    const transactionData = JSON.stringify({
      id: transaction.id,
      item_id: transaction.item_id,
      transaction_type: transaction.transaction_type,
      quantity: transaction.quantity,
      user_id: transaction.user_id,
      transaction_date: transaction.transaction_date,
      notes: transaction.notes,
      timestamp: new Date().toISOString(),
    });

    // Generate a SHA-256 hash of the transaction data
    const hash = crypto
      .createHash("sha256")
      .update(transactionData)
      .digest("hex");

    return hash;
  } catch (error) {
    console.error("Error generating blockchain hash:", error);
    throw new Error("Failed to generate blockchain hash");
  }
};

/**
 * Verifies a blockchain transaction hash
 * This is a simplified simulation of blockchain verification
 * In a real-world application, this would verify against an actual blockchain
 *
 * @param {Object} transaction - The transaction object
 * @param {string} hash - The blockchain hash to verify
 * @returns {boolean} - Whether the hash is valid
 */
const verifyTransactionHash = (transaction, hash) => {
  try {
    // In a real blockchain implementation, we would verify the hash against the blockchain
    // For this simulation, we'll just check that the hash is a valid SHA-256 hash
    const isValidHash = /^[a-f0-9]{64}$/i.test(hash);

    // Simulate verification delay
    // In a real implementation, this would be an actual blockchain verification
    return isValidHash;
  } catch (error) {
    console.error("Error verifying blockchain hash:", error);
    return false;
  }
};

/**
 * Gets a block explorer URL for a transaction hash
 * This is a simplified simulation
 * In a real-world application, this would return a URL to a real block explorer
 *
 * @param {string} hash - The blockchain hash
 * @returns {string} - The block explorer URL
 */
const getBlockExplorerUrl = (hash) => {
  // In a real implementation, this would return a URL to a real block explorer
  // For this simulation, we'll return a fake URL
  return `https://example-blockchain-explorer.com/tx/${hash}`;
};

module.exports = {
  generateTransactionHash,
  verifyTransactionHash,
  getBlockExplorerUrl,
};
