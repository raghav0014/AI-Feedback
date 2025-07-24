import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
});

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  summary: string;
  keywords: string[];
  isFake: boolean;
  fakeConfidence: number;
}

export interface ReviewAnalysisRequest {
  title: string;
  content: string;
  rating: number;
  productName: string;
}

class AIService {
  async analyzeSentiment(review: ReviewAnalysisRequest): Promise<SentimentAnalysis> {
    try {
      const prompt = `
Analyze the following product review for sentiment, authenticity, and provide a summary:

Product: ${review.productName}
Title: ${review.title}
Rating: ${review.rating}/5
Review: ${review.content}

Please provide a JSON response with the following structure:
{
  "sentiment": "positive|negative|neutral",
  "score": number between -1 and 1,
  "confidence": number between 0 and 1,
  "summary": "brief summary of the review",
  "keywords": ["array", "of", "key", "words"],
  "isFake": boolean,
  "fakeConfidence": number between 0 and 1
}

Consider factors like:
- Overall tone and language used
- Consistency between rating and text
- Specific details vs generic statements
- Grammar and writing style
- Emotional authenticity
`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert sentiment analysis and fake review detection AI. Respond only with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI service');
      }

      try {
        const analysis = JSON.parse(content);
        
        // Validate the response structure
        if (!this.isValidAnalysis(analysis)) {
          throw new Error('Invalid analysis structure');
        }

        return analysis;
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        throw new Error('Invalid AI response format');
      }

    } catch (error) {
      console.error('AI Analysis Error:', error);
      
      // Fallback to basic analysis if AI fails
      return this.fallbackAnalysis(review);
    }
  }

  private isValidAnalysis(analysis: any): analysis is SentimentAnalysis {
    return (
      typeof analysis === 'object' &&
      ['positive', 'negative', 'neutral'].includes(analysis.sentiment) &&
      typeof analysis.score === 'number' &&
      typeof analysis.confidence === 'number' &&
      typeof analysis.summary === 'string' &&
      Array.isArray(analysis.keywords) &&
      typeof analysis.isFake === 'boolean' &&
      typeof analysis.fakeConfidence === 'number'
    );
  }

  private fallbackAnalysis(review: ReviewAnalysisRequest): SentimentAnalysis {
    // Simple rule-based fallback
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'recommend'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing'];
    
    const text = `${review.title} ${review.content}`.toLowerCase();
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    let sentiment: 'positive' | 'negative' | 'neutral';
    let score: number;
    
    if (review.rating >= 4 || positiveCount > negativeCount) {
      sentiment = 'positive';
      score = 0.5 + (review.rating - 3) * 0.2;
    } else if (review.rating <= 2 || negativeCount > positiveCount) {
      sentiment = 'negative';
      score = -0.5 - (3 - review.rating) * 0.2;
    } else {
      sentiment = 'neutral';
      score = 0;
    }

    return {
      sentiment,
      score: Math.max(-1, Math.min(1, score)),
      confidence: 0.6,
      summary: `${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} review about ${review.productName} with ${review.rating}/5 rating.`,
      keywords: text.split(' ').filter(word => word.length > 4).slice(0, 5),
      isFake: review.content.length < 20 || review.content.split(' ').length < 10,
      fakeConfidence: review.content.length < 20 ? 0.8 : 0.2
    };
  }

  async generateSummary(reviews: any[]): Promise<string> {
    if (reviews.length === 0) return 'No reviews available.';

    try {
      const reviewSample = reviews.slice(0, 10).map(r => 
        `Rating: ${r.rating}/5 - ${r.title}: ${r.content.substring(0, 100)}...`
      ).join('\n');

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes product reviews. Provide a concise summary highlighting key themes, common praise, and concerns."
          },
          {
            role: "user",
            content: `Summarize these product reviews:\n\n${reviewSample}`
          }
        ],
        temperature: 0.5,
        max_tokens: 200
      });

      return response.choices[0]?.message?.content || 'Unable to generate summary.';
    } catch (error) {
      console.error('Summary generation error:', error);
      return 'Summary generation temporarily unavailable.';
    }
  }
}

export const aiService = new AIService();