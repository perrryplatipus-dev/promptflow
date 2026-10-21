import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Terminal, 
  ArrowRight, 
  Layers, 
  Activity, 
  GitCompare, 
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // AI comparison simulator states
  const [simStep, setSimStep] = useState(0); // 0: Idle/Writing, 1: Streaming, 2: Evaluating, 3: Winner
  const [simOutputA, setSimOutputA] = useState('');
  const [simOutputB, setSimOutputB] = useState('');
  const [simLatencyA, setSimLatencyA] = useState(0);
  const [simLatencyB, setSimLatencyB] = useState(0);

  const textA = "To write high-converting copy, focus on the user's primary pain point (guessing prompt performance), then present PromptFlow as the instant, real-time comparison solution that eliminates guesswork.";
  const textB = "Write a clear, developer-focused headline: A/B Test Prompts Instantly. Then highlight key features: side-by-side WebSockets streaming, token counting, cost tracking, and automated metric evaluations.";

  useEffect(() => {
    let timer: any;
    if (simStep === 0) {
      // Writing simulation delay
      setSimOutputA('');
      setSimOutputB('');
      setSimLatencyA(0);
      setSimLatencyB(0);
      timer = setTimeout(() => setSimStep(1), 2000);
    } else if (simStep === 1) {
      // Streaming simulation
      let indexA = 0;
      let indexB = 0;
      const start = Date.now();
      
      const streamTimer = setInterval(() => {
        const charCount = 5;
        let active = false;
        
        if (indexA < textA.length) {
          setSimOutputA(textA.substring(0, indexA + charCount));
          indexA += charCount;
          active = true;
        } else if (!simLatencyA) {
          setSimLatencyA(Date.now() - start - 300);
        }

        if (indexB < textB.length) {
          setSimOutputB(textB.substring(0, indexB + charCount));
          indexB += charCount;
          active = true;
        } else if (!simLatencyB) {
          setSimLatencyB(Date.now() - start - 500);
        }

        if (!active) {
          clearInterval(streamTimer);
          setSimStep(2);
        }
      }, 40);
    } else if (simStep === 2) {
      // Evaluating scores
      timer = setTimeout(() => setSimStep(3), 2000);
    } else if (simStep === 3) {
      // Display Winner & Reset after delay
      timer = setTimeout(() => setSimStep(0), 5000);
    }
    return () => clearTimeout(timer);
  }, [simStep]);

  const faqs = [
    {
      q: "How does side-by-side prompt testing work?",
      a: "PromptFlow allows you to input one or more variables and test two system prompts (Prompt A vs Prompt B) concurrently. The requests are processed on our Node backend and streamed token-by-token using WebSockets back to React side-by-side panels."
    },
    {
      q: "Can I use my own LLM API keys?",
      a: "Yes! By default, the application runs simulated mock streams so you can inspect the workflows. You can head over to the Settings page at any time to add your personal OpenAI or Google Gemini API keys to make real calls."
    },
    {
      q: "What automated evaluation metrics do you support?",
      a: "Our scoring service evaluates response models on Tone matching, Accuracy based on context, Output Length formatting, and Grammatical structure to compile an Overall Score out of 10 for each response."
    },
    {
      q: "Is PromptFlow responsive?",
      a: "Absolutely. PromptFlow has been built from the ground up for desktop, tablet, and mobile browsers, optimizing the side-by-side prompt layout so you can debug on the go."
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#0F172A] overflow-hidden text-slate-100 font-sans">
      
      {/* Background Glowing Decors */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-[#6C63FF]/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-[#00D4FF]/10 to-transparent blur-[120px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="relative flex items-center justify-between px-6 lg:px-12 h-20 max-w-7xl mx-auto border-b border-slate-900 z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C63FF] to-[#5B8CFF] shadow-lg shadow-[#6C63FF]/20">
            <Terminal size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Prompt<span className="text-[#6C63FF]">Flow</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
          >
            Log In
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gradient-to-r from-[#6C63FF] to-[#5B8CFF] hover:opacity-90 rounded-xl shadow-lg shadow-[#6C63FF]/25 border border-[#6C63FF]/30 transition"
          >
            Get Started Free
            <ArrowRight size={13} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 px-6 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-5 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[#6C63FF]/10 text-[#6C63FF] border border-[#6C63FF]/20">
              <Sparkles size={12} className="animate-spin-slow" />
              Real-Time LLM Prompt Testing
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] text-white">
              Optimize AI Prompts <br />
              <span className="text-gradient">With Real-Time A/B Testing</span>
            </h1>
            
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Stream completions from OpenAI & Gemini side-by-side. Benchmark latency, costs, and token density. Auto-evaluate outputs with intelligent metrics to deploy with confidence.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button 
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold bg-gradient-to-r from-[#6C63FF] to-[#5B8CFF] hover:opacity-95 rounded-xl shadow-xl shadow-[#6C63FF]/20 border border-[#6C63FF]/30 transition-all transform hover:scale-[1.02]"
              >
                Sign Up and Deploy
                <ArrowRight size={15} />
              </button>
              
              <button 
                onClick={() => {
                  const el = document.getElementById('features');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold bg-slate-800/40 hover:bg-slate-800/60 text-slate-300 rounded-xl border border-slate-800 transition"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Right Hero Column (Live AI Comparison Simulator) */}
          <div className="lg:col-span-7">
            <div className="glass-panel w-full rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
              
              {/* Simulator Header */}
              <div className="flex items-center justify-between px-5 h-12 bg-slate-900/60 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#EF4444]/30 border border-[#EF4444]/60" />
                  <div className="w-3 h-3 rounded-full bg-[#F59E0B]/30 border border-[#F59E0B]/60" />
                  <div className="w-3 h-3 rounded-full bg-[#22C55E]/30 border border-[#22C55E]/60" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                    Simulator
                  </span>
                  <span className="text-[10px] text-[#6C63FF] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#6C63FF] rounded-full animate-ping" />
                    LIVE DEMO
                  </span>
                </div>
              </div>

              {/* Simulator Variable Input */}
              <div className="p-4 border-b border-slate-800/60 bg-slate-950/20 flex flex-wrap items-center gap-3">
                <span className="text-[10px] font-semibold text-slate-500">Variables:</span>
                <span className="text-[10px] font-medium px-2.5 py-1 bg-slate-800/60 rounded-lg text-slate-300 border border-slate-700/60">
                  {`{audience}: `}<span className="text-[#00D4FF]">"Developers"</span>
                </span>
                <span className="text-[10px] font-medium px-2.5 py-1 bg-slate-800/60 rounded-lg text-slate-300 border border-slate-700/60">
                  {`{tone}: `}<span className="text-[#00D4FF]">"Productive"</span>
                </span>
              </div>

              {/* Panels comparison content */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 min-h-[220px]">
                
                {/* Prompt A Side */}
                <div className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-300">Prompt A (Marketing model)</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#6C63FF]/15 text-[#6C63FF] border border-[#6C63FF]/20 font-bold">GPT-4o-mini</span>
                    </div>
                    
                    {simStep === 0 && (
                      <p className="text-[11px] text-slate-500 font-mono italic animate-pulse">Initializing prompt A system instructions...</p>
                    )}
                    
                    {(simStep >= 1) && (
                      <p className="text-[11px] text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                        {simOutputA}
                        {simStep === 1 && simOutputA.length < textA.length && (
                          <span className="w-1.5 h-3 bg-slate-400 inline-block ml-0.5 animate-pulse" />
                        )}
                      </p>
                    )}
                  </div>
                  
                  {/* Metrics */}
                  {simLatencyA > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-500">
                      <span>Latency: <b className="text-slate-300">{simLatencyA}ms</b></span>
                      <span>Cost: <b className="text-slate-300">$0.00008</b></span>
                    </div>
                  )}
                </div>

                {/* Prompt B Side */}
                <div className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-300">Prompt B (Technical model)</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#5B8CFF]/15 text-[#5B8CFF] border border-[#5B8CFF]/20 font-bold">Gemini 1.5 Flash</span>
                    </div>
                    
                    {simStep === 0 && (
                      <p className="text-[11px] text-slate-500 font-mono italic animate-pulse">Initializing prompt B system instructions...</p>
                    )}
                    
                    {(simStep >= 1) && (
                      <p className="text-[11px] text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                        {simOutputB}
                        {simStep === 1 && simOutputB.length < textB.length && (
                          <span className="w-1.5 h-3 bg-slate-400 inline-block ml-0.5 animate-pulse" />
                        )}
                      </p>
                    )}
                  </div>

                  {/* Metrics */}
                  {simLatencyB > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-500">
                      <span>Latency: <b className="text-slate-300">{simLatencyB}ms</b></span>
                      <span>Cost: <b className="text-slate-300">$0.00004</b></span>
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom Evaluation Banner */}
              <AnimatePresence>
                {simStep >= 2 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0 }}
                    className="bg-slate-900 px-5 py-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {simStep === 2 ? (
                        <>
                          <Activity size={14} className="text-[#6C63FF] animate-spin" />
                          <span className="text-slate-400 font-medium">Running automated metrics criteria check...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} className="text-[#22C55E]" />
                          <span className="text-slate-300 font-semibold">Evaluation Finished</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {simStep === 3 && (
                        <>
                          <span className="text-slate-500 text-[10px]">A Score: <b className="text-slate-300">8.2</b></span>
                          <span className="text-slate-500 text-[10px]">B Score: <b className="text-[#00D4FF]">9.5</b></span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[9px]">
                            🏆 PROMPT B WINNER
                          </span>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto border-t border-slate-900 z-10">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Engineered For Prompt Quality Control
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Eliminate prompt guesswork. Build robust applications by measuring LLM performance against objective engineering criteria.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "WebSocket Streaming",
              desc: "Socket.io streaming streams responses token-by-token directly into React side-by-side markdown panels.",
              icon: GitCompare
            },
            {
              title: "Automated Evaluations",
              desc: "Compare outputs and grade them out of 10 on tone alignment, accuracy checks, structure, and grammar.",
              icon: ShieldCheck
            },
            {
              title: "Cost & Latency Audits",
              desc: "Analyze and benchmark cost spend per request, response size count, latency peaks, and average output time.",
              icon: Activity
            },
            {
              title: "Version Control Logs",
              desc: "Track every prompt trial, project changes history, variables usage, and winning badges under project history.",
              icon: Layers
            }
          ].map((feat, idx) => (
            <div 
              key={idx}
              className="glass-panel p-6 rounded-2xl hover:border-[#6C63FF]/30 transition-all group cursor-default"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 text-[#6C63FF] border border-slate-700/60 mb-5 group-hover:scale-110 transition-transform duration-200">
                <feat.icon size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-200 mb-2">{feat.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-20 px-6 max-w-4xl mx-auto border-t border-slate-900 z-10">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-400">
            Everything you need to know about setting up PromptFlow.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="glass-panel rounded-2xl overflow-hidden border border-slate-800"
            >
              <button
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-800/20 transition-all"
              >
                <span className="flex items-center gap-3">
                  <HelpCircle size={16} className="text-[#6C63FF]" />
                  {faq.q}
                </span>
                <span className="text-[#6C63FF] font-bold text-sm">
                  {faqOpen === idx ? '−' : '+'}
                </span>
              </button>
              
              <AnimatePresence>
                {faqOpen === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 text-[11px] sm:text-xs text-slate-400 leading-relaxed border-t border-slate-800/40 pt-3">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/40 py-12 px-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-[#6C63FF] to-[#5B8CFF]">
              <Terminal size={12} className="text-white" />
            </div>
            <span className="font-bold text-slate-300">PromptFlow</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
            <a href="#" className="hover:text-white transition">Product</a>
            <a href="#" className="hover:text-white transition">Docs</a>
            <a href="#" className="hover:text-white transition">GitHub</a>
            <a href="#" className="hover:text-white transition">Privacy</a>
          </div>

          <p className="text-[10px] text-slate-600">
            © {new Date().getFullYear()} PromptFlow AI. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
};
