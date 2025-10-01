import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Review from '../models/Review.js';
import { connectDB } from '../config/database.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Review.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@feedback.com',
      password: 'admin123',
      role: 'admin',
      emailVerified: true,
      reputation: 1000
    });

    // Create regular users
    const users = await User.create([
      {
        name: 'John Smith',
        email: 'john@example.com',
        password: 'password123',
        emailVerified: true,
        reputation: 150
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        password: 'password123',
        emailVerified: true,
        reputation: 200
      },
      {
        name: 'Mike Wilson',
        email: 'mike@example.com',
        password: 'password123',
        emailVerified: true,
        reputation: 120
      }
    ]);

    console.log('👥 Created users');

    // Create sample reviews
    const reviews = [
      {
        user: users[0]._id,
        productName: 'iPhone 15 Pro',
        category: 'Technology',
        title: 'Excellent camera quality',
        content: 'The camera on this phone is absolutely amazing. The night mode works perfectly and the photos are crystal clear. Highly recommend for photography enthusiasts.',
        rating: 5,
        status: 'approved',
        sentiment: 'positive',
        sentimentScore: 0.8,
        summary: 'Highly positive review praising camera quality and night mode features.',
        keywords: ['camera', 'night mode', 'photos', 'quality'],
        isVerified: true,
        blockchainHash: '0x1234567890abcdef1234567890abcdef12345678',
        helpful: 15
      },
      {
        user: users[1]._id,
        productName: 'Tesla Model 3',
        category: 'Automotive',
        title: 'Great electric vehicle',
        content: 'Love the performance and efficiency. The autopilot feature is impressive and the charging network is extensive. Some minor software bugs but overall excellent.',
        rating: 4,
        status: 'approved',
        sentiment: 'positive',
        sentimentScore: 0.6,
        summary: 'Positive review highlighting performance, efficiency, and autopilot features.',
        keywords: ['performance', 'efficiency', 'autopilot', 'charging'],
        isVerified: true,
        blockchainHash: '0xabcdef1234567890abcdef1234567890abcdef12',
        helpful: 8
      },
      {
        user: users[2]._id,
        productName: 'MacBook Pro M3',
        category: 'Technology',
        title: 'Needs improvement',
        content: 'The performance is good but the battery life could be better. Also, it gets quite warm during intensive tasks. The display is beautiful though.',
        rating: 3,
        status: 'pending',
        sentiment: 'neutral',
        sentimentScore: -0.1,
        summary: 'Mixed review with concerns about battery life and heating issues.',
        keywords: ['performance', 'battery', 'warm', 'display'],
        isVerified: false,
        blockchainHash: '0x567890abcdef1234567890abcdef1234567890ab',
        helpful: 3
      }
    ];

    await Review.create(reviews);

    // Update user review counts
    await User.findByIdAndUpdate(users[0]._id, { reviewCount: 1 });
    await User.findByIdAndUpdate(users[1]._id, { reviewCount: 1 });
    await User.findByIdAndUpdate(users[2]._id, { reviewCount: 1 });

    console.log('📝 Created sample reviews');
    console.log('✅ Database seeded successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();