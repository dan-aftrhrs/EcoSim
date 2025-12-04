
import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap, Check, PieChart } from 'lucide-react';
import { SPECIES_CONFIG, SpeciesType } from '../types';

export interface TutorialStep {
  targetRef?: React.RefObject<HTMLElement | null>;
  text: React.ReactNode;
  position?: 'top' | 'bottom' | 'center';
  customContent?: React.ReactNode;
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ steps, onComplete, onSkip }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const step = steps[currentStepIndex];
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Update rectangle when step changes or window resizes
  useEffect(() => {
    const updateRect = () => {
      if (step.targetRef && step.targetRef.current) {
        setTargetRect(step.targetRef.current.getBoundingClientRect());
      } else {
        setTargetRect(null); // Center mode or custom graphic
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);
    
    // Slight delay to allow UI to settle if it just rendered
    setTimeout(updateRect, 100);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [currentStepIndex, step]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onComplete();
    }
  };

  // Determine styles for the spotlight box
  let spotlightStyle: React.CSSProperties = {};
  
  if (targetRect) {
    spotlightStyle = {
      top: targetRect.top - 5,
      left: targetRect.left - 5,
      width: targetRect.width + 10,
      height: targetRect.height + 10,
      position: 'absolute',
      // Decreased opacity from 0.85 to 0.60 to make background more visible
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.60)', 
      borderRadius: '8px',
      zIndex: 50,
      pointerEvents: 'none',
      transition: 'all 0.4s ease-out'
    };
  } else {
    // Full screen darken if no target
    spotlightStyle = {
      position: 'fixed',
      inset: 0,
      // Decreased opacity from 0.85 to 0.60
      backgroundColor: 'rgba(0, 0, 0, 0.60)',
      zIndex: 50,
    };
  }

  // Determine styles for the Content Card
  let cardStyle: React.CSSProperties = {};

  if (targetRect) {
      if (isMobile) {
          // Mobile: Center horizontally, position vertically relative to target
          cardStyle = {
              position: 'fixed',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              maxWidth: '400px',
              zIndex: 60,
          };

          // Position Top or Bottom based on step preference
          if (step.position === 'top') {
              // Target is likely at bottom, place card above it
              // We calculate "bottom" distance from screen bottom
              cardStyle.bottom = (window.innerHeight - targetRect.top) + 20;
          } else {
              // Target is likely at top, place card below it
              cardStyle.top = targetRect.bottom + 20;
          }

      } else {
          // Desktop: Exact positioning anchored to target
          cardStyle = {
              position: 'absolute',
              zIndex: 60,
              width: '100%',
              maxWidth: '384px', // max-w-sm
              top: step.position === 'top' ? targetRect.top - 10 : (targetRect.bottom + 20),
              left: targetRect.left + (targetRect.width/2),
              transform: step.position === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)'
          };
      }
  } else {
      // Center Screen (No Target)
      cardStyle = {
          position: 'fixed',
          zIndex: 60,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '400px'
      };
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-auto">
      {/* The spotlight/background layer */}
      <div style={spotlightStyle} className="border-2 border-white/20 animate-in fade-in duration-500"></div>

      {/* The Content Card */}
      <div 
        className="transition-all duration-500"
        style={cardStyle}
      >
         <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl w-full text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-teal-400"></div>
            
            {step.customContent && (
                <div className="mb-6 flex justify-center">
                    {step.customContent}
                </div>
            )}

            <div className="text-white text-sm md:text-base font-medium mb-6 leading-relaxed">
                {step.text}
            </div>

            <div className="flex justify-between items-center gap-4">
                <button onClick={onSkip} className="text-xs text-slate-500 hover:text-slate-300">
                    Skip Tutorial
                </button>
                <button 
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                    {currentStepIndex === steps.length - 1 ? (
                        <>Start Sim <Check size={16} /></>
                    ) : (
                        <>Next <ArrowRight size={16} /></>
                    )}
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};

// --- Custom Graphics for Tutorial Steps ---

export const DistributionGraphic = () => {
    const data = [
        { label: 'Flora', val: 70, color: SPECIES_CONFIG[SpeciesType.PLANT].color },
        { label: 'Swarmers', val: 15, color: SPECIES_CONFIG[SpeciesType.INSECT].color },
        { label: 'Grazers', val: 10, color: SPECIES_CONFIG[SpeciesType.HERBIVORE].color },
        { label: 'Hunters', val: 4, color: SPECIES_CONFIG[SpeciesType.PREDATOR].color },
        { label: 'Apex', val: 1, color: SPECIES_CONFIG[SpeciesType.APEX].color },
    ];
    
    return (
        <div className="w-full bg-slate-950 rounded-lg p-4 border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 mb-3 flex items-center justify-center gap-2"><PieChart size={14}/> INITIAL BIOMASS</h4>
            <div className="flex h-4 w-full rounded-full overflow-hidden mb-4">
                {data.map((d, i) => (
                    <div key={i} style={{ width: `${d.val}%`, backgroundColor: d.color }} title={`${d.label}: ${d.val}%`}></div>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div>
                        <span className="text-slate-300 truncate">{d.label}</span>
                        <span className="text-slate-500 font-mono ml-auto">{d.val}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export const BalancerGraphic = () => {
    return (
        <div className="flex gap-4 items-center justify-center p-2">
            <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-teal-900/50 border-2 border-teal-400 flex items-center justify-center shadow-[0_0_15px_rgba(45,212,191,0.3)] animate-pulse">
                    <Zap size={24} className="text-teal-400" />
                </div>
                <span className="text-xs font-bold text-teal-400">THE BALANCER</span>
            </div>
        </div>
    )
}
