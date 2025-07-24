interface BlockchainTransaction {
  hash: string;
  timestamp: number;
  data: any;
}

interface IPFSUploadResult {
  hash: string;
  url: string;
}

class BlockchainService {
  private isWeb3Available(): boolean {
    return typeof window !== 'undefined' && 'ethereum' in window;
  }

  async generateHash(data: any): Promise<string> {
    try {
      // Create a deterministic hash from the review data
      const jsonString = JSON.stringify(data, Object.keys(data).sort());
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonString);
      
      // Use Web Crypto API for hashing
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return `0x${hashHex}`;
    } catch (error) {
      console.error('Hash generation error:', error);
      // Fallback hash generation
      return `0x${Math.random().toString(16).substr(2, 40)}`;
    }
  }

  async storeOnBlockchain(reviewData: any): Promise<BlockchainTransaction> {
    try {
      // In a real implementation, this would interact with a smart contract
      // For now, we'll simulate blockchain storage
      
      const hash = await this.generateHash(reviewData);
      const transaction: BlockchainTransaction = {
        hash,
        timestamp: Date.now(),
        data: {
          reviewId: reviewData.id,
          contentHash: hash,
          timestamp: reviewData.timestamp,
          verified: true
        }
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store in localStorage as a simulation of blockchain storage
      const existingTransactions = JSON.parse(
        localStorage.getItem('blockchain_transactions') || '[]'
      );
      existingTransactions.push(transaction);
      localStorage.setItem('blockchain_transactions', JSON.stringify(existingTransactions));

      return transaction;
    } catch (error) {
      console.error('Blockchain storage error:', error);
      throw new Error('Failed to store on blockchain');
    }
  }

  async verifyOnBlockchain(hash: string): Promise<boolean> {
    try {
      const transactions = JSON.parse(
        localStorage.getItem('blockchain_transactions') || '[]'
      );
      
      return transactions.some((tx: BlockchainTransaction) => tx.hash === hash);
    } catch (error) {
      console.error('Blockchain verification error:', error);
      return false;
    }
  }

  async uploadToIPFS(content: any): Promise<IPFSUploadResult> {
    try {
      // In a real implementation, this would upload to IPFS
      // For now, we'll simulate IPFS storage
      
      const contentString = JSON.stringify(content);
      const hash = await this.generateHash(content);
      const ipfsHash = hash.replace('0x', 'Qm'); // Simulate IPFS hash format
      
      // Store in localStorage as simulation
      const ipfsData = JSON.parse(localStorage.getItem('ipfs_data') || '{}');
      ipfsData[ipfsHash] = contentString;
      localStorage.setItem('ipfs_data', JSON.stringify(ipfsData));

      return {
        hash: ipfsHash,
        url: `${import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/'}${ipfsHash}`
      };
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error('Failed to upload to IPFS');
    }
  }

  async getFromIPFS(hash: string): Promise<any> {
    try {
      const ipfsData = JSON.parse(localStorage.getItem('ipfs_data') || '{}');
      const content = ipfsData[hash];
      
      if (!content) {
        throw new Error('Content not found on IPFS');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('IPFS retrieval error:', error);
      throw new Error('Failed to retrieve from IPFS');
    }
  }

  async getTransactionHistory(reviewId: string): Promise<BlockchainTransaction[]> {
    try {
      const transactions = JSON.parse(
        localStorage.getItem('blockchain_transactions') || '[]'
      );
      
      return transactions.filter((tx: BlockchainTransaction) => 
        tx.data.reviewId === reviewId
      );
    } catch (error) {
      console.error('Transaction history error:', error);
      return [];
    }
  }
}

export const blockchainService = new BlockchainService();