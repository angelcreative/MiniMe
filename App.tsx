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

  const handleDownload = () => {
    if (!genState.resultImage) return;
    const link = document.createElement('a');
    link.href = genState.resultImage;
    link.download = `minime-${gender}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!genState.resultImage) return;
    try {
      // Convert base64 to blob for sharing
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
        // Fallback if native sharing is not supported
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-6 selection:bg-pink-200">
      <div className="w-full max-w-4xl space-y-10">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <div className="inline-block px-4 py-1.5 bg-white rounded-full shadow-sm mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">AI Baby Generator</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
            MiniMe <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500">AI</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-lg mx-auto text-sm md:text-base">
            Upload photos of both parents and let our AI predict your future child's adorable face!
          </p>
        </header>

        {/* Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start max-w-3xl mx-auto">
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

        {/* Action Section */}
        <div className="flex flex-col items-center justify-center gap-8 bg-white/60 p-8 rounded-3xl backdrop-blur-sm max-w-2xl mx-auto border border-white/50 shadow-sm">
          
          <div className="space-y-3 text-center w-full">
             <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Select Gender</p>
             {/* Gender Selection */}
             <div className="flex justify-center p-1.5 bg-slate-100 rounded-full w-fit mx-auto">
                <button
                  onClick={() => setGender('boy')}
                  className={`
                    flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all duration-300
                    ${gender === 'boy' 
                      ? 'bg-white text-sky-500 shadow-md transform scale-105' 
                      : 'text-slate-400 hover:text-slate-600'}
                  `}
                >
                  <span className="text-lg">👦</span> Boy
                </button>
                <button
                  onClick={() => setGender('girl')}
                  className={`
                    flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all duration-300
                    ${gender === 'girl' 
                      ? 'bg-white text-pink-500 shadow-md transform scale-105' 
                      : 'text-slate-400 hover:text-slate-600'}
                  `}
                >
                  <span className="text-lg">👧</span> Girl
                </button>
              </div>
          </div>

          <div className="flex flex-col items-center gap-4 w-full">
            <Button 
              onClick={handleGenerate} 
              isLoading={genState.isLoading}
              disabled={!dadImage || !momImage}
              className="w-full md:w-auto min-w-[200px]"
            >
              {genState.isLoading ? `Creating Magic...` : `Meet Your Future ${gender === 'boy' ? 'Son' : 'Daughter'}`}
            </Button>

            {genState.error && (
              <p className="text-rose-400 text-sm font-medium bg-rose-50 px-4 py-2 rounded-lg">{genState.error}</p>
            )}
          </div>
        </div>

        {/* Result Section */}
        {genState.resultImage && (
          <div className="flex flex-col items-center pb-16 animate-fade-in">
             <h2 className="text-2xl font-bold text-slate-700 mb-6">Here is your MiniMe! ✨</h2>
             <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border-8 border-white bg-white">
               <img 
                 src={genState.resultImage} 
                 alt={`Generated ${gender}`} 
                 className="w-full h-auto object-cover"
               />
             </div>
             
             <div className="flex gap-4 mt-8">
               <button 
                 onClick={handleDownload}
                 className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm hover:shadow transition-all border border-slate-100"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                 Download
               </button>
               <button 
                 onClick={handleShare}
                 className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                 Share
               </button>
             </div>

             <button 
               onClick={() => window.location.reload()}
               className="mt-6 text-indigo-400 hover:text-indigo-600 text-sm font-bold underline decoration-2 underline-offset-4 transition-colors"
             >
               Start Over
             </button>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default App;