import { Idea, UserSession } from '../types';
import Fuse from 'fuse.js';

export class MemoryService {
  private static readonly SESSION_KEY = 'ai-idea-board-session';
  
  static getSession(): UserSession {
    const saved = localStorage.getItem(this.SESSION_KEY);
    if (saved) {
      const session = JSON.parse(saved);
      return {
        ...session,
        lastActiveAt: new Date(session.lastActiveAt)
      };
    }
    
    const newSession: UserSession = {
      id: crypto.randomUUID(),
      lastActiveAt: new Date(),
      totalIdeas: 0,
      returningUser: false
    };
    
    this.saveSession(newSession);
    return newSession;
  }
  
  static saveSession(session: UserSession): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }
  
  static updateSession(updates: Partial<UserSession>): UserSession {
    const session = this.getSession();
    const updated = { ...session, ...updates, lastActiveAt: new Date() };
    this.saveSession(updated);
    return updated;
  }
  
  static isReturningUser(): boolean {
    const session = this.getSession();
    const daysSinceLastActive = (Date.now() - session.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);
    return session.returningUser || daysSinceLastActive > 1;
  }
  
  static async findIdeaByQuery(query: string, ideas: Idea[]): Promise<Idea | null> {
    if (!query.trim() || ideas.length === 0) return null;
    
    const fuse = new Fuse(ideas, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'description', weight: 0.3 },
        { name: 'tags', weight: 0.2 },
        { name: 'painPoints', weight: 0.1 }
      ],
      threshold: 0.4,
      includeScore: true
    });
    
    const results = fuse.search(query);
    return results.length > 0 ? results[0].item : null;
  }
  
  static saveLastQuery(query: string): void {
    this.updateSession({ lastIdeaQuery: query });
  }
  
  static getMemoryInsights(ideas: Idea[]): {
    oldestUntouchedIdea?: Idea;
    mostDevelopedIdea?: Idea;
    needsAttentionIdeas: Idea[];
    patterns: string[];
  } {
    if (ideas.length === 0) {
      return { needsAttentionIdeas: [], patterns: [] };
    }
    
    const now = new Date();
    const daysSince = (date: Date) => (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    
    // Find oldest untouched idea
    const oldestUntouchedIdea = ideas
      .filter(idea => !idea.lastViewedAt || daysSince(idea.lastViewedAt) > 7)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    
    // Find most developed idea
    const mostDevelopedIdea = ideas
      .sort((a, b) => b.maturityScore - a.maturityScore)[0];
    
    // Find ideas that need attention
    const needsAttentionIdeas = ideas.filter(idea => 
      idea.maturityScore < 50 && daysSince(idea.updatedAt) > 3
    );
    
    // Identify patterns
    const patterns: string[] = [];
    const categories = ideas.map(i => i.category);
    const mostCommonCategory = this.getMostFrequent(categories);
    if (mostCommonCategory) {
      patterns.push(`You tend to focus on ${mostCommonCategory} ideas`);
    }
    
    const avgMaturity = ideas.reduce((sum, idea) => sum + idea.maturityScore, 0) / ideas.length;
    if (avgMaturity < 40) {
      patterns.push('Your ideas could use more development');
    } else if (avgMaturity > 70) {
      patterns.push('You develop ideas thoroughly');
    }
    
    return {
      oldestUntouchedIdea,
      mostDevelopedIdea,
      needsAttentionIdeas,
      patterns
    };
  }
  
  private static getMostFrequent<T>(arr: T[]): T | null {
    if (arr.length === 0) return null;
    
    const counts = arr.reduce((acc, item) => {
      acc[item as string] = (acc[item as string] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0] as T;
  }
}