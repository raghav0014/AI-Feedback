import crypto from 'crypto';

class BlockchainService {
  async generateHash(data) {
    try {
      const jsonString = JSON.stringify(data, Object.keys(data).sort());
      const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
      return `0x${hash}`;
    } catch (error) {
      console.error('Hash generation error:', error);
      return `0x${Math.random().toString(16).substr(2, 40)}`;
    }
  }

  async storeOnBlockchain(reviewData) {
    try {
      // Simulate blockchain storage
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const hash = await this.generateHash(reviewData);
      
      return {
        hash,
        timestamp: Date.now(),
        data: {
          reviewId: reviewData.id,
          contentHash: hash,
          timestamp: reviewData.timestamp,
          verified: true
        }
      };
    } catch (error) {
      console.error('Blockchain storage error:', error);
      throw error;
    }
  }

  async verifyOnBlockchain(hash) {
    try {
      // Simulate blockchain verification
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (error) {
      console.error('Blockchain verification error:', error);
      return false;
    }
  }
}

export const blockchainService = new BlockchainService();