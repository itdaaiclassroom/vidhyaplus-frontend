import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Index from './Index';

const LaunchReveal = () => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);

  // Advanced velvet curtain folds styling using repeating gradients and ambient shadow layers
  const leftCurtainStyle = {
    backgroundImage: `
      linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.1) 15%, rgba(0, 0, 0, 0.1) 85%, rgba(0, 0, 0, 0.8) 100%),
      linear-gradient(90deg, 
        #150002 0%, 
        #300104 12.5%, 
        #590209 25%, 
        #870511 37.5%, 
        #b00c19 50%, 
        #870511 62.5%, 
        #590209 75%, 
        #300104 87.5%, 
        #150002 100%
      )
    `,
    backgroundSize: '140px 100%',
    backgroundRepeat: 'repeat-x',
    boxShadow: 'inset -40px 0 80px rgba(0,0,0,0.95), 20px 0 40px rgba(0,0,0,0.7)'
  };

  const rightCurtainStyle = {
    backgroundImage: `
      linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.1) 15%, rgba(0, 0, 0, 0.1) 85%, rgba(0, 0, 0, 0.8) 100%),
      linear-gradient(90deg, 
        #150002 0%, 
        #300104 12.5%, 
        #590209 25%, 
        #870511 37.5%, 
        #b00c19 50%, 
        #870511 62.5%, 
        #590209 75%, 
        #300104 87.5%, 
        #150002 100%
      )
    `,
    backgroundSize: '140px 100%',
    backgroundRepeat: 'repeat-x',
    boxShadow: 'inset 40px 0 80px rgba(0,0,0,0.95), -20px 0 40px rgba(0,0,0,0.7)'
  };

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-white select-none">
      
      {/* Underlying Live Website */}
      <div className="w-full h-full min-h-screen">
        <Index />
      </div>

      {/* Premium Theater Curtain Overlay */}
      <AnimatePresence onExitComplete={() => setAnimationDone(true)}>
        {!isRevealed && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden">
            
            {/* Ambient Room Shadow Overlay */}
            <div className="absolute inset-0 bg-black/30 pointer-events-none z-10" />

            {/* Left Curtain */}
            <motion.div 
              initial={{ x: 0 }}
              exit={{ 
                x: "-100%",
                transition: { duration: 4.5, ease: [0.76, 0, 0.24, 1] }
              }}
              style={leftCurtainStyle}
              className="absolute left-0 top-0 bottom-0 w-1/2 z-20 flex items-center justify-end"
            >
              {/* Luxury Bottom Gold Fringe */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-5"
                style={{
                  background: 'linear-gradient(90deg, #b8860b 0%, #ffd700 25%, #996515 50%, #ffd700 75%, #b8860b 100%)',
                  borderTop: '1px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 -4px 15px rgba(255, 215, 0, 0.4)'
                }}
              />
              <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-r from-transparent to-black/60 pointer-events-none" />
            </motion.div>

            {/* Right Curtain */}
            <motion.div 
              initial={{ x: 0 }}
              exit={{ 
                x: "100%",
                transition: { duration: 4.5, ease: [0.76, 0, 0.24, 1] }
              }}
              style={rightCurtainStyle}
              className="absolute right-0 top-0 bottom-0 w-1/2 z-20 flex items-center justify-start"
            >
              {/* Luxury Bottom Gold Fringe */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-5"
                style={{
                  background: 'linear-gradient(90deg, #b8860b 0%, #ffd700 25%, #996515 50%, #ffd700 75%, #b8860b 100%)',
                  borderTop: '1px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 -4px 15px rgba(255, 215, 0, 0.4)'
                }}
              />
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-l from-transparent to-black/60 pointer-events-none" />
            </motion.div>

            {/* Elegant Hanging Gold Ropes & Tassels */}
            <motion.div
              exit={{ opacity: 0, y: -100, transition: { duration: 2.0 } }}
              className="absolute left-12 top-0 bottom-24 w-1 z-30 hidden md:flex flex-col items-center justify-end"
            >
              {/* Cord */}
              <div className="w-1.5 h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 shadow-md" />
              {/* Tassel Connect */}
              <div className="w-4 h-6 rounded bg-gradient-to-b from-amber-500 to-amber-700 border border-yellow-300 shadow-lg" />
              {/* Tassel Fringe */}
              <div className="w-6 h-12 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 rounded-b-xl shadow-xl animate-pulse" />
            </motion.div>

            <motion.div
              exit={{ opacity: 0, y: -100, transition: { duration: 2.0 } }}
              className="absolute right-12 top-0 bottom-24 w-1 z-30 hidden md:flex flex-col items-center justify-end"
            >
              {/* Cord */}
              <div className="w-1.5 h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 shadow-md" />
              {/* Tassel Connect */}
              <div className="w-4 h-6 rounded bg-gradient-to-b from-amber-500 to-amber-700 border border-yellow-300 shadow-lg" />
              {/* Tassel Fringe */}
              <div className="w-6 h-12 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 rounded-b-xl shadow-xl animate-pulse" />
            </motion.div>

            {/* Top Valance (Arch curtain piece) */}
            <motion.div
              exit={{ y: "-100%", transition: { duration: 3.5, ease: [0.76, 0, 0.24, 1] } }}
              className="absolute top-0 left-0 right-0 h-28 z-30 flex flex-col justify-between"
              style={{
                background: `
                  linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%),
                  linear-gradient(90deg, #1f0103, #4a0309, #7a0812, #4a0309, #1f0103)
                `,
                boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
                borderBottom: '5px solid #d4af37'
              }}
            >
              {/* Soft decorative shadow line */}
              <div className="w-full h-full bg-gradient-to-b from-transparent to-black/30" />
            </motion.div>

            {/* Golden Grand Entrance Emblem */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, transition: { delay: 0.2, duration: 1 } }}
              exit={{ 
                scale: 0.7, 
                opacity: 0, 
                filter: "blur(8px)", 
                transition: { duration: 0.8, ease: "easeIn" } 
              }}
              className="absolute z-50 flex flex-col items-center justify-center p-8 text-center"
            >
              {/* Glowing back auror */}
              <div className="absolute w-72 h-72 rounded-full bg-amber-500/10 blur-3xl animate-pulse pointer-events-none" />

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsRevealed(true)}
                className="group relative flex flex-col items-center justify-center w-64 h-64 rounded-full border-[6px] border-amber-300/80 transition-all cursor-pointer overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7),_0_0_50px_rgba(212,175,55,0.4)]"
                style={{
                  background: 'radial-gradient(circle, #250205 0%, #0d0001 100%)',
                }}
              >
                {/* Shiny metallic gold overlay ring */}
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,215,0,0.15)_0%,transparent_50%,rgba(255,215,0,0.15)_100%)] pointer-events-none" />

                {/* Inner Crest Container */}
                <div className="flex flex-col items-center justify-center space-y-3 z-10 px-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="p-3.5 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-amber-950 shadow-inner"
                  >
                    <Sparkles size={28} className="fill-amber-950/20" />
                  </motion.div>
                  
                  <div className="space-y-1">
                    <h2 className="text-amber-300 font-extrabold tracking-[0.3em] text-lg font-display">
                      VIDHYA PLUS
                    </h2>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto" />
                    <p className="text-[10px] text-amber-400/80 tracking-[0.4em] font-medium uppercase pt-1">
                      Grand Reveal
                    </p>
                  </div>
                </div>

                {/* Gold Rim Highlight */}
                <div className="absolute inset-2 rounded-full border border-amber-400/20 pointer-events-none" />
                
                {/* Hover ring effect */}
                <div className="absolute inset-0 rounded-full border-2 border-amber-400/0 group-hover:border-amber-400/30 transition-all duration-700" />
                
                {/* Clean hover overlay flash */}
                <div className="absolute -inset-y-12 -inset-x-20 w-32 bg-white/5 skew-x-12 -translate-x-full group-hover:translate-x-[350px] transition-transform duration-1000 ease-out" />
              </motion.button>

              {/* Action caption */}
              <motion.span 
                initial={{ opacity: 0.6 }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="mt-6 text-amber-300/90 font-medium tracking-[0.3em] text-[10px] uppercase bg-black/45 backdrop-blur-md px-5 py-2.5 rounded-full border border-amber-400/25 shadow-md pointer-events-none"
              >
                Click to Open Curtains
              </motion.span>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LaunchReveal;
