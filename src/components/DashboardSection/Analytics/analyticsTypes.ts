// Analytics/analyticsTypes.ts

export type Post = {
  id: number;
  status: string;
  topicName: string;
  platforms: string | string[];
  scheduledAt: string | null;
  createdAt: string;
  caption: string | null;
  imageUrl: string | null;
};

export type FacebookSummary = {
  fans: number;
  followers: number;
  name: string;
  profilePicture: string;
  impressionsTimeline:  { date: string; value: number }[];
  engagedUsersTimeline: { date: string; value: number }[];
  fanAddsTimeline:      { date: string; value: number }[];
  recentPosts: {
    id: string; message: string; createdTime: string;
    fullPicture: string; permalinkUrl: string;
  }[];
  totalImpressions:  number;
  totalEngagedUsers: number;
};

export type IgComment = {
  id: string;
  text: string;
  timestamp: string;
  username: string;
  sentiment?: "positive" | "negative" | "neutral"; // rempli côté frontend via Claude API
};

export type InstagramSummary = {
  followers: number;
  mediaCount: number;
  name: string;
  profilePicture: string;
  reachTimeline:    { date: string; value: number }[];
  followerTimeline: { date: string; value: number }[];
  topPosts: {
    id: string; caption: string; mediaType: string; mediaUrl: string;
    timestamp: string; likeCount: number; commentCount: number; permalink: string;
    comments?: IgComment[]; // commentaires récupérés séparément
  }[];
  totalLikes: number;
  totalComments: number;
};

export type LinkedInSummary = {
  followers: number;
  name: string;
  profilePicture: string;
  connectionsCount: number;
  impressionsTimeline: { date: string; value: number }[];
  clicksTimeline:      { date: string; value: number }[];
  reactionsTimeline:   { date: string; value: number }[];
  recentPosts: {
    id: string; text: string; createdAt: string;
    likes: number; comments: number; shares: number;
    imageUrl: string;
  }[];
  totalImpressions: number;
  totalReactions:   number;
  totalClicks:      number;
};

export type TikTokSummary = {
  followers: number;
  following: number;
  likes:     number;
  videoCount: number;
  name: string;
  profilePicture: string;
  viewsTimeline:   { date: string; value: number }[];
  likesTimeline:   { date: string; value: number }[];
  recentVideos: {
    id: string; title: string; coverUrl: string; shareUrl: string;
    playCount: number; likeCount: number; commentCount: number;
    shareCount: number; createTime: string;
  }[];
  totalViews:    number;
  totalLikes:    number;
  totalComments: number;
  totalShares:   number;
};