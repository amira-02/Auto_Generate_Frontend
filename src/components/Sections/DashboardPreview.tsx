// src/components/DashboardPreview.tsx
import React, { useEffect, useRef, useState } from 'react';

const DashboardPreview: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [trigger, setTrigger] = useState(0); // Force re-animation on scroll

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTrigger(prev => prev + 1); // Re-trigger animations every time section is visible
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Experience Your Future Website Builder
          </h2>
          <p className="text-2xl text-gray-600">AI-Powered Design + Content Generation</p>
        </div>

        {/* Main Dashboard */}
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border">
          {/* Top Bar */}
          <div className="h-14 bg-gray-50 border-b flex items-center px-6 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center text-white font-bold">IS</div>
              <span className="font-bold text-2xl tracking-tighter">IntelliSite</span>
            </div>
            <div className="flex gap-8 text-sm">
              <span className="font-semibold text-violet-600">Dashboard</span>
              <span>Templates</span>
              <span>AI Studio</span>
              <span>Analytics</span>
            </div>
            <div className="text-sm bg-white px-5 py-2 rounded-2xl shadow">Live AI Mode</div>
          </div>

          <div className="p-8 grid grid-cols-12 gap-6">
            {/* Left - Overview */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-3xl p-7">
                <p className="text-sm text-gray-500">PROJECT SCORE</p>
                <div className="text-6xl font-bold text-gray-900 mt-2">94<span className="text-3xl">%</span></div>
                <p className="text-emerald-600">Excellent AI Match</p>
              </div>

              {/* Bar Chart - Content Types */}
              <div className="bg-white border rounded-3xl p-6">
                <p className="font-semibold mb-4">Content Distribution</p>
                <div className="space-y-5">
                  {[
                    { label: "Hero Sections", percent: 65, color: "violet" },
                    { label: "About Pages", percent: 45, color: "pink" },
                    { label: "Service Cards", percent: 80, color: "emerald" },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>{item.label}</span>
                        <span className="font-medium">{item.percent}%</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          key={trigger}
                          className={`h-full bg-${item.color}-500 rounded-full transition-all duration-1500`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Center - Live Preview + Big Line Chart */}
            <div className="col-span-12 lg:col-span-5 space-y-6">
              <div className="relative rounded-3xl overflow-hidden border bg-gray-900 aspect-video">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900" 
                  alt="preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <div className="uppercase tracking-widest text-xs opacity-70">LIVE PREVIEW</div>
                  <div className="text-3xl font-semibold">Nfikha Portfolio 2026</div>
                </div>
              </div>

              {/* Animated Line Chart */}
              <div className="bg-white border rounded-3xl p-6">
                <p className="font-semibold mb-4">Predicted Engagement Trend</p>
                <svg key={trigger} viewBox="0 0 500 200" className="w-full h-52">
                  <polyline
                    points="30,170 100,140 170,155 240,90 310,110 380,45 450,65"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="30,170 100,140 170,155 240,90 310,110 380,45 450,65"
                    fill="none"
                    stroke="#c4b5fd"
                    strokeWidth="3"
                    strokeDasharray="8 4"
                  />
                </svg>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span>
                </div>
              </div>
            </div>

            {/* Right Column - Multiple Graphs */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
              {/* Mini Pie Chart */}
              <div className="bg-white border rounded-3xl p-6">
                <p className="font-medium mb-4">Design Style</p>
                <div className="flex justify-center my-4">
                  <svg width="160" height="160" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="18" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="18"
                      strokeDasharray="95 160" strokeDashoffset="10" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#ec4899" strokeWidth="18"
                      strokeDasharray="45 160" strokeDashoffset="-85" />
                  </svg>
                </div>
                <div className="text-center text-sm space-y-1">
                  <div>Modern <span className="font-bold text-violet-600">62%</span></div>
                  <div>Minimal <span className="font-bold text-pink-500">38%</span></div>
                </div>
              </div>

              {/* Quick Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border rounded-3xl p-5 text-center">
                  <p className="text-4xl font-bold text-emerald-500">87</p>
                  <p className="text-xs text-gray-500">AI Suggestions</p>
                </div>
                <div className="bg-white border rounded-3xl p-5 text-center">
                  <p className="text-4xl font-bold text-amber-500">12</p>
                  <p className="text-xs text-gray-500">Templates Used</p>
                </div>
              </div>

              {/* AI Recommendation Box */}
              <div className="bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 text-white rounded-3xl p-6">
                <p className="opacity-75 text-sm">NEXT RECOMMENDATION</p>
                <p className="text-lg font-semibold mt-2 leading-tight">
                  Add parallax scroll + 3D hover effects
                </p>
                <button className="mt-6 w-full py-4 bg-white text-violet-700 rounded-2xl font-semibold hover:bg-white/90 transition">
                  Generate Instantly
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPreview;