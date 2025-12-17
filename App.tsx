import React, { useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { Button } from './components/Button';
import { UploadedImage, GenerationState, ChildGender } from './types';
import { generateChildFace } from './services/geminiService';

const App: React.FC = () => {
  const [dadImage, setDadImage] = useState<UploadedImage | null>(null);
  const [momImage, setMomImage] = useState<UploadedImage | null>(null);
  const [gender, setGender] = useState<ChildGender>('girl');
  const [genState, setGenState] = useState<GenerationState>({
    isLoading: false,
    resultImage: null,
    error: null,
  });

  const handleGenerate = async () => {
    if (!dadImage || !momImage) return;

    setGenState({ isLoading: true, resultImage: null, error: null });

    try {
      const resultBase64 = await generateChildFace(
        dadImage.base64,
        dadImage.mimeType,
        momImage.base64,
        momImage.mimeType,
        gender
      );
      setGenState({ isLoading: false, resultImage: resultBase64, error: null });
    } catch (err: any) {
      setGenState({ 
        isLoading: false, 
        resultImage: null, 
        error: "Failed to generate image. Please try again." 
      });
    }
  };

  const handleDownload = async () => {
    if (!genState.resultImage) return;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      try {
        const response = await fetch(genState.resultImage);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch (e) {
        window.open(genState.resultImage, '_blank');
      }
    } else {
      const link = document.createElement('a');
      link.href = genState.resultImage;
      link.download = `minime-${gender}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    if (!genState.resultImage) return;
    try {
      const response = await fetch(genState.resultImage);
      const blob = await response.blob();
      const file = new File([blob], `minime-${gender}.png`, { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          title: 'My MiniMe AI Result',
          text: 'Check out what our future kid might look like!',
          files: [file],
        });
      } else {
        alert("Sharing is not supported on this browser. Please use the Download button.");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const DadIcon = (
    <span className="text-7xl filter drop-shadow-sm grayscale-0" role="img" aria-label="Dad">👨</span>
  );

  const MomIcon = (
    <span className="text-7xl filter drop-shadow-sm grayscale-0" role="img" aria-label="Mom">👩</span>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 selection:bg-indigo-100">
      <div className="w-full max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT PANEL: Inputs & Controls (7 Columns) */}
          <div className="lg:col-span-7 flex flex-col gap-8 order-2 lg:order-1">
            
            {/* Header (Desktop aligned left, Mobile centered) */}
            <header className="text-center lg:text-left space-y-2">
              <div className="inline-block px-4 py-1.5 bg-white rounded-full shadow-sm mb-2 border border-slate-100">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">AI Baby Generator</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
                MiniMe <span className="text-indigo-500">AI</span>
              </h1>
              <p className="text-slate-500 font-medium text-sm md:text-base max-w-lg mx-auto lg:mx-0">
                Upload photos of both parents and let our genetic AI predict your future child's adorable face!
              </p>
            </header>

            {/* Uploaders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploader 
                label="Dad's Photo" 
                subLabel="Upload a clear portrait"
                image={dadImage}
                onImageUpload={setDadImage}
                onRemove={() => setDadImage(null)}
                icon={DadIcon}
              />
              <ImageUploader 
                label="Mom's Photo" 
                subLabel="Upload a clear portrait"
                image={momImage}
                onImageUpload={setMomImage}
                onRemove={() => setMomImage(null)}
                icon={MomIcon}
              />
            </div>

            {/* Controls */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                 
                 {/* Gender Selector */}
                 <div className="flex flex-col items-center md:items-start gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Gender</span>
                    <div className="flex p-1 bg-slate-100 rounded-full">
                      <button
                        onClick={() => setGender('boy')}
                        className={`
                          flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300
                          ${gender === 'boy' 
                            ? 'bg-white text-sky-500 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'}
                        `}
                      >
                        <span className="text-lg">👦</span> Boy
                      </button>
                      <button
                        onClick={() => setGender('girl')}
                        className={`
                          flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300
                          ${gender === 'girl' 
                            ? 'bg-white text-pink-500 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'}
                        `}
                      >
                        <span className="text-lg">👧</span> Girl
                      </button>
                    </div>
                 </div>

                 {/* Generate Button */}
                 <div className="w-full md:w-auto">
                    <Button 
                      onClick={handleGenerate} 
                      isLoading={genState.isLoading}
                      disabled={!dadImage || !momImage}
                      className="w-full md:min-w-[220px]"
                    >
                      {genState.isLoading ? `Creating Magic...` : `Meet Your Future ${gender === 'boy' ? 'Son' : 'Daughter'}`}
                    </Button>
                 </div>
              </div>
              
              {genState.error && (
                <p className="text-center text-rose-400 text-sm font-medium bg-rose-50 px-4 py-2 rounded-lg border border-rose-100">
                  {genState.error}
                </p>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Result Area (5 Columns) - Sticky on Desktop */}
          <div className="lg:col-span-5 order-1 lg:order-2 lg:sticky lg:top-8">
            <div className={`
              relative w-full rounded-[2.5rem] overflow-hidden transition-all duration-500
              ${genState.resultImage 
                ? 'bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]' 
                : 'bg-white/50 border-2 border-dashed border-indigo-100 min-h-[400px] lg:min-h-[600px] flex flex-col items-center justify-center p-8'}
            `}>
              
              {genState.resultImage ? (
                // RESULT STATE
                <div className="flex flex-col h-full animate-fade-in">
                  <div className="relative w-full aspect-[4/5] bg-slate-100">
                    <img 
                      src={genState.resultImage} 
                      alt={`Generated ${gender}`} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm">
                      <span className="text-xs font-bold text-slate-600">✨ AI Generated</span>
                    </div>
                  </div>
                  
                  <div className="p-6 md:p-8 space-y-6 bg-white">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-slate-800 mb-1">Your MiniMe is Here!</h2>
                      <p className="text-slate-500 text-sm">
                        Based on genetic traits from both parents.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                         Download
                      </button>
                      <button 
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                         Share
                      </button>
                    </div>

                    <button 
                      onClick={() => window.location.reload()}
                      className="w-full text-indigo-400 hover:text-indigo-600 text-xs font-bold uppercase tracking-wider py-2 transition-colors"
                    >
                      Start Over
                    </button>
                  </div>
                </div>
              ) : (
                // EMPTY / LOADING STATE
                <div className="text-center space-y-6 max-w-xs">
                  <div className="relative mx-auto w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center">
                    {genState.isLoading ? (
                       // Loading Spinner
                       <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin"></div>
                    ) : (
                       // Placeholder Icon
                       <span className="text-5xl opacity-50">👶</span>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">
                      {genState.isLoading ? 'Analyzing DNA...' : 'Ready to Create'}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {genState.isLoading 
                        ? 'Our AI is carefully combining features to generate the most probable look.' 
                        : 'Upload both parents photos and hit generate to see the magic happen here.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default App;