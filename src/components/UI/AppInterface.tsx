// src/components/AppInterface.tsx
import React from 'react';

const AppInterface: React.FC = () => {
  const stories = [
    { name: "You", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" },
    { name: "nfikha", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400" },
    { name: "tunisia", image: "https://images.unsplash.com/photo-1507101105822-7472b28e22ac?w=400" },
    { name: "medali", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400" },
    { name: "sara", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400" },
    { name: "amine", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400" },
  ];

  const posts = [
    {
      username: "nfikha.design",
      location: "Sidi Bou Said, Tunisia",
      image: "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800",
      likes: "24,892",
      caption: "The iconic blue doors of Sidi Bou Said never disappoint 💙 #Tunisia #SidiBouSaid",
    },
    {
      username: "tunisia.vibes",
      location: "Tunis, Tunisia",
      image: "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800",
      likes: "15,674",
      caption: "Golden hour in the capital city ✨ Who else loves Tunis at sunset? #Tunis #Tunisia",
    },
  ];

  return (
    <div className="h-full w-full bg-white flex flex-col overflow-hidden">
      {/* Instagram Header */}
      <div className="h-14 border-b flex items-center px-4 bg-white z-10">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold tracking-tighter">Instagram</span>
        </div>
        <div className="ml-auto flex items-center gap-6 text-2xl">
          <span>❤️</span>
          <span>✉️</span>
        </div>
      </div>

      {/* Stories with Real Images */}
      <div className="h-20 border-b bg-white flex items-center gap-4 px-4 overflow-x-auto hide-scrollbar">
        {stories.map((story, i) => (
          <div key={i} className="flex flex-col items-center flex-shrink-0">
            <div className="w-14 h-14 rounded-full border-2 border-pink-500 p-0.5 overflow-hidden">
              <img
                src={story.image}
                alt={story.name}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <p className="text-xs mt-1 text-gray-700">{story.name}</p>
          </div>
        ))}
      </div>

      {/* Feed Posts */}
      <div className="flex-1 overflow-y-auto pb-4 hide-scrollbar">
        {posts.map((post, index) => (
          <div key={index} className="mb-8">
            {/* Post Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 rounded-full"></div>
                <div>
                  <p className="font-semibold text-sm">{post.username}</p>
                  <p className="text-xs text-gray-500">{post.location}</p>
                </div>
              </div>
              <span className="text-2xl font-bold">⋯</span>
            </div>

            {/* Real Post Image */}
            <div className="w-full aspect-square bg-gray-100 overflow-hidden">
              <img 
                src={post.image} 
                alt="post" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between px-4 py-3 text-3xl">
              <div className="flex gap-6">
                <span>❤️</span>
                <span>💭</span>
                <span>📤</span>
              </div>
              <span>🔖</span>
            </div>

            {/* Likes & Caption */}
            <div className="px-4 space-y-1">
              <p className="font-semibold">{post.likes} likes</p>
              <p className="text-sm leading-snug">
                <span className="font-semibold mr-1">{post.username}</span>
                {post.caption}
              </p>
              <p className="text-xs text-gray-400 mt-2">View all 342 comments</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="h-14 border-t bg-white flex items-center justify-around text-3xl">
        <span>🏠</span>
        <span>🔍</span>
        <span className="text-4xl -mt-1 text-black">+</span>
        <span>❤️</span>
        <span>👤</span>
      </div>
    </div>
  );
};

export default AppInterface;