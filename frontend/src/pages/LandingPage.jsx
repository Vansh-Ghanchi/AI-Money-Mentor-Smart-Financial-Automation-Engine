import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Advanced Cinematic Background System */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
        {/* Layer 1: Parallax Drifting Image */}
        <div 
          className="absolute inset-[-5%] z-0 bg-cover bg-center bg-no-repeat animate-cinematic opacity-80"
          style={{ 
            backgroundImage: "url('/landing-bg.png')",
          }}
        ></div>

        {/* Layer 2: Floating Bokeh / Light Particles */}
        <div className="absolute inset-0 z-10 pointer-events-none opacity-40">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-400/20 rounded-full blur-[100px] animate-bokeh"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-bokeh [animation-delay:-5s]"></div>
          <div className="absolute top-1/2 left-2/3 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] animate-bokeh [animation-delay:-10s]"></div>
        </div>

        {/* Layer 3: Dynamic Vignette & Overlay */}
        <div className="absolute inset-0 z-20 bg-gradient-to-b from-black/40 via-transparent to-black/80"></div>
        <div className="absolute inset-0 z-20 bg-black/40 backdrop-brightness-75"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full text-white px-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-center tracking-tight animate-fade-in-up">
          Smart <span className="text-yellow-400">Finance</span>
        </h1>
        <p className="text-xl md:text-2xl mb-12 text-gray-200 text-center max-w-2xl animate-fade-in-up delay-100">
          Simplify your financial journey. Track, manage, and grow your wealth with ease.
        </p>

        <div className="flex flex-col md:flex-row gap-6 w-full max-w-lg animate-fade-in-up delay-200">
          <button
            onClick={() => navigate('/login')}
            className="flex-1 group relative px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="text-2xl font-semibold mb-1">Personal</div>
            <div className="text-sm text-gray-300 group-hover:text-white">For Individual Users</div>
          </button>

          <button
            onClick={() => navigate('/business-register')}
            className="flex-1 group relative px-8 py-4 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/40 rounded-xl hover:bg-yellow-500/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="text-2xl font-semibold mb-1 text-yellow-300">Partners</div>
            <div className="text-sm text-yellow-100 group-hover:text-white">Business & Joint Accounts</div>
          </button>
        </div>
        
        <div className="mt-12 text-sm text-gray-400">
           Already have an account? <span onClick={() => navigate('/login')} className="text-white underline cursor-pointer hover:text-yellow-400">Log in here</span>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
