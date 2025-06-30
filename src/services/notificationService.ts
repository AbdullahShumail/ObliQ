import { Notification, Idea } from '../types';

export class NotificationService {
  private static readonly NOTIFICATIONS_KEY = 'ai-idea-board-notifications';
  
  static getNotifications(): Notification[] {
    const saved = localStorage.getItem(this.NOTIFICATIONS_KEY);
    if (saved) {
      return JSON.parse(saved).map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt)
      }));
    }
    return [];
  }
  
  static saveNotifications(notifications: Notification[]): void {
    localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }
  
  static addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): void {
    const notifications = this.getNotifications();
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      read: false
    };
    
    notifications.unshift(newNotification);
    this.saveNotifications(notifications.slice(0, 50)); // Keep only latest 50
  }
  
  static markAsRead(notificationId: string): void {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.saveNotifications(updated);
  }
  
  static generateSmartNotifications(ideas: Idea[]): void {
    const now = new Date();
    const daysSince = (date: Date) => (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    
    // Find stale ideas
    const staleIdeas = ideas.filter(idea => 
      daysSince(idea.updatedAt) > 7 && idea.maturityScore < 60
    );
    
    staleIdeas.forEach(idea => {
      this.addNotification({
        type: 'reminder',
        title: 'Still thinking about this?',
        message: `Your idea "${idea.title}" hasn't been touched in ${Math.floor(daysSince(idea.updatedAt))} days. Want to revisit it with fresh eyes?`,
        ideaId: idea.id,
        actionable: true
      });
    });
    
    // Find ideas ready for next stage
    const readyIdeas = ideas.filter(idea => 
      idea.maturityScore > 70 && idea.developmentStage === 'structured'
    );
    
    readyIdeas.forEach(idea => {
      this.addNotification({
        type: 'suggestion',
        title: 'Ready for validation?',
        message: `"${idea.title}" looks well-developed. Consider validating it with potential users.`,
        ideaId: idea.id,
        actionable: true
      });
    });
    
    // Milestone notifications
    if (ideas.length === 10) {
      this.addNotification({
        type: 'milestone',
        title: '🎉 10 Ideas Captured!',
        message: 'You\'ve captured 10 ideas! You\'re building a solid foundation for innovation.',
        actionable: false
      });
    }
  }
  
  static getUnreadCount(): number {
    return this.getNotifications().filter(n => !n.read).length;
  }
}