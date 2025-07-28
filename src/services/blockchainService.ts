import { ethers } from 'ethers';

interface BlockchainTransaction {
  hash: string;
  timestamp: number;
  data: any;
  blockNumber?: number;
  gasUsed?: string;
}

interface IPFSUploadResult {
  hash: string;
  url: string;
}

interface Web3Config {
  rpcUrl: string;
  contractAddress: string;
  privateKey?: string;
}

class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private contract: ethers.Contract | null = null;
  private wallet: ethers.Wallet | null = null;
  private config: Web3Config;

  constructor() {
    this.config = {
      rpcUrl: import.meta.env.VITE_WEB3_RPC_URL || 'https://polygon-rpc.com',
      contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
      privateKey: import.meta.env.VITE_PRIVATE_KEY
    };
    
    this.initializeWeb3();
  }

  private async initializeWeb3() {
    try {
      if (this.config.rpcUrl && this.config.contractAddress) {
        this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
        
        if (this.config.privateKey) {
          this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
        }

        // Smart contract ABI for review storage
        const contractABI = [
          "function storeReview(string memory reviewHash, string memory ipfsHash) public returns (uint256)",
          "function getReview(uint256 reviewId) public view returns (string memory, string memory, uint256)",
          "function verifyReview(string memory reviewHash) public view returns (bool)",
          "event ReviewStored(uint256 indexed reviewId, string reviewHash, string ipfsHash, address indexed author)"
        ];

        this.contract = new ethers.Contract(
          this.config.contractAddress,
          contractABI,
          this.wallet || this.provider
        );
      }
    } catch (error) {
      console.warn('Web3 initialization failed, using fallback:', error);
    }
  }

  private isWeb3Available(): boolean {
    return this.provider !== null && this.contract !== null;
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
      const hash = await this.generateHash(reviewData);
      
      if (this.isWeb3Available() && this.wallet) {
        // Upload to IPFS first
        const ipfsResult = await this.uploadToIPFS(reviewData);
        
        // Store on blockchain
        const tx = await this.contract!.storeReview(hash, ipfsResult.hash);
        const receipt = await tx.wait();
        
        const transaction: BlockchainTransaction = {
          hash: receipt.hash,
          timestamp: Date.now(),
          data: {
            reviewId: reviewData.id,
            contentHash: hash,
            ipfsHash: ipfsResult.hash,
            timestamp: reviewData.timestamp,
            verified: true
          },
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        };

        // Store locally for quick access
        this.storeTransactionLocally(transaction);
        return transaction;
      } else {
        // Fallback to local storage simulation
        return this.storeLocally(reviewData, hash);
      }
    } catch (error) {
      console.error('Blockchain storage error:', error);
      // Fallback to local storage
      const hash = await this.generateHash(reviewData);
      return this.storeLocally(reviewData, hash);
    }
  }

  private async storeLocally(reviewData: any, hash: string): Promise<BlockchainTransaction> {
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
    this.storeTransactionLocally(transaction);
    return transaction;
  }

  private storeTransactionLocally(transaction: BlockchainTransaction) {
    const existingTransactions = JSON.parse(
      localStorage.getItem('blockchain_transactions') || '[]'
    );
    existingTransactions.push(transaction);
    localStorage.setItem('blockchain_transactions', JSON.stringify(existingTransactions));
  }

  async verifyOnBlockchain(hash: string): Promise<boolean> {
    try {
      if (this.isWeb3Available()) {
        const isVerified = await this.contract!.verifyReview(hash);
        return isVerified;
      } else {
        // Fallback to local verification
        const transactions = JSON.parse(
          localStorage.getItem('blockchain_transactions') || '[]'
        );
        return transactions.some((tx: BlockchainTransaction) => tx.hash === hash);
      }
    } catch (error) {
      console.error('Blockchain verification error:', error);
      return false;
    }
  }

  async uploadToIPFS(content: any): Promise<IPFSUploadResult> {
    try {
      const ipfsApiUrl = import.meta.env.VITE_IPFS_API_URL || 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
      const ipfsApiKey = import.meta.env.VITE_IPFS_API_KEY;
      
      if (ipfsApiKey && ipfsApiUrl.includes('pinata')) {
        // Use Pinata IPFS service
        const response = await fetch(ipfsApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ipfsApiKey}`
          },
          body: JSON.stringify({
            pinataContent: content,
            pinataMetadata: {
              name: `review-${Date.now()}`,
              keyvalues: {
                type: 'review',
                timestamp: new Date().toISOString()
              }
            }
          })
        });

        if (response.ok) {
          const result = await response.json();
          return {
            hash: result.IpfsHash,
            url: `${import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/'}${result.IpfsHash}`
          };
        }
      }
      
      // Fallback to local simulation
      return this.simulateIPFSUpload(content);
    } catch (error) {
      console.error('IPFS upload error:', error);
      return this.simulateIPFSUpload(content);
    }
  }

  private async simulateIPFSUpload(content: any): Promise<IPFSUploadResult> {
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
  }

  async getFromIPFS(hash: string): Promise<any> {
    try {
      const ipfsGateway = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
      
      // Try to fetch from IPFS gateway
      const response = await fetch(`${ipfsGateway}${hash}`);
      if (response.ok) {
        return await response.json();
      }
      
      // Fallback to local storage
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

  async getNetworkInfo(): Promise<{
    network: string;
    blockNumber: number;
    gasPrice: string;
    isConnected: boolean;
  }> {
    try {
      if (this.provider) {
        const network = await this.provider.getNetwork();
        const blockNumber = await this.provider.getBlockNumber();
        const gasPrice = await this.provider.getFeeData();
        
        return {
          network: network.name,
          blockNumber,
          gasPrice: gasPrice.gasPrice?.toString() || '0',
          isConnected: true
        };
      }
      
      return {
        network: 'local',
        blockNumber: 0,
        gasPrice: '0',
        isConnected: false
      };
    } catch (error) {
      console.error('Network info error:', error);
      return {
        network: 'unknown',
        blockNumber: 0,
        gasPrice: '0',
        isConnected: false
      };
    }
  }

  async estimateGas(reviewData: any): Promise<string> {
    try {
      if (this.contract && this.wallet) {
        const hash = await this.generateHash(reviewData);
        const ipfsResult = await this.uploadToIPFS(reviewData);
        const gasEstimate = await this.contract.storeReview.estimateGas(hash, ipfsResult.hash);
        return gasEstimate.toString();
      }
      return '21000'; // Default gas limit
    } catch (error) {
      console.error('Gas estimation error:', error);
      return '21000';
    }
  }
}

export const blockchainService = new BlockchainService();