import React, { useState } from 'react';
import { Image as ImageIcon, X, Download, Wand2, Settings2, AlertCircle, Check } from 'lucide-react';
import { generateMergedImage } from './services/geminiService';
import { AspectRatio, ImageQuality, UploadedImage, GenerationConfig } from './types';
import { DEFAULT_ASPECT_RATIO, DEFAULT_QUALITY, ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE_MB } from './constants';

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const result = reader.result;
        // Extract base64 part (remove data:image/xxx;base64, prefix)
        const base64 = result.split(',')[1];
        resolve(base64);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function App() {
  const [image1, setImage1] = useState<UploadedImage | null>(null);
  const [image2, setImage2] = useState<UploadedImage | null>(null);
  const [prompt, setPrompt] = useState('');
  const [config, setConfig] = useState<GenerationConfig>({
    aspectRatio: DEFAULT_ASPECT_RATIO,
    quality: DEFAULT_QUALITY,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File, slot: 1 | 2) => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File size too large. Max ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Invalid file type. Please upload JPG, PNG, or WEBP.');
      return;
    }

    try {
      const base64 = await readFileAsBase64(file);
      const previewUrl = URL.createObjectURL(file);
      const newImage: UploadedImage = {
        file,
        previewUrl,
        base64,
        mimeType: file.type,
      };

      if (slot === 1) setImage1(newImage);
      else setImage2(newImage);
      setError(null);
    } catch (err) {
      setError('Failed to process image.');
    }
  };

  const handleRemoveImage = (slot: 1 | 2) => {
    if (slot === 1) {
      if (image1?.previewUrl) URL.revokeObjectURL(image1.previewUrl);
      setImage1(null);
    } else {
      if (image2?.previewUrl) URL.revokeObjectURL(image2.previewUrl);
      setImage2(null);
    }
  };

  const handleGenerate = async () => {
    if (!image1 || !image2) {
      setError('Please upload both images.');
      return;
    }
    if (!prompt.trim()) {
      setError('Please describe how to merge the images.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResultImage(null);

    try {
      const result = await generateMergedImage(
        image1.base64,
        image1.mimeType,
        image2.base64,
        image2.mimeType,
        prompt,
        config.aspectRatio,
        config.quality
      );
      setResultImage(result);
      
      // Scroll to result
      setTimeout(() => {
        document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err: any) {
      console.error("Generation Error:", err);
      const errorMessage = err.message || 'Failed to generate image. Please try again.';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = 'merged-image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReset = () => {
    if (image1?.previewUrl) URL.revokeObjectURL(image1.previewUrl);
    if (image2?.previewUrl) URL.revokeObjectURL(image2.previewUrl);
    setImage1(null);
    setImage2(null);
    setPrompt('');
    setResultImage(null);
    setError(null);
    setConfig({ aspectRatio: DEFAULT_ASPECT_RATIO, quality: DEFAULT_QUALITY });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-10 px-4 sm:px-6 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white mb-2 shadow-lg shadow-emerald-200">
            <Wand2 className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            From 2 Image Get One
          </h1>
          <p className="text-slate-600 text-lg max-w-xl mx-auto">
            Upload two images and describe how to blend them. Our AI will create a cohesive masterpiece.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
          <div className="p-6 sm:p-10 space-y-8">
            
            {/* Upload Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[1, 2].map((slot) => {
                const img = slot === 1 ? image1 : image2;
                return (
                  <div key={slot} className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700 ml-1 uppercase tracking-wider">
                      Image {slot}
                    </label>
                    <div className={`relative group aspect-square sm:aspect-[4/3] rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${img ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30'}`}>
                      {img ? (
                        <>
                          <img 
                            src={img.previewUrl} 
                            alt={`Upload ${slot}`} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              onClick={() => handleRemoveImage(slot as 1 | 2)}
                              className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-3 rounded-full transition-colors"
                            >
                              <X className="w-6 h-6" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <label className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 transition-colors">
                          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                            <ImageIcon className="w-7 h-7 text-slate-400 group-hover:text-emerald-500" />
                          </div>
                          <span className="text-base font-medium">Click to upload</span>
                          <span className="text-xs opacity-60 mt-1">JPG, PNG, WEBP</span>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept={ACCEPTED_IMAGE_TYPES.join(',')}
                            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], slot as 1 | 2)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Controls Section */}
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 ml-1 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., Merge the texture of image 1 onto the shape of image 2, set in a futuristic city with neon lights..."
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all resize-none h-32 text-slate-700 placeholder:text-slate-400"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 ml-1 uppercase tracking-wider">
                    <Settings2 className="w-4 h-4" />
                    Aspect Ratio
                  </label>
                  <div className="relative">
                    <select
                      value={config.aspectRatio}
                      onChange={(e) => setConfig({ ...config, aspectRatio: e.target.value as AspectRatio })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all appearance-none cursor-pointer"
                    >
                      {Object.values(AspectRatio).map((ratio) => (
                        <option key={ratio} value={ratio}>{ratio}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 ml-1 uppercase tracking-wider">
                    <Settings2 className="w-4 h-4" />
                    Quality
                  </label>
                  <div className="relative">
                    <select
                      value={config.quality}
                      onChange={(e) => setConfig({ ...config, quality: e.target.value as ImageQuality })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all appearance-none cursor-pointer"
                    >
                      {Object.values(ImageQuality).map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-xl text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !image1 || !image2 || !prompt}
                className={`w-full sm:flex-1 py-4 rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all duration-300
                  ${isGenerating || !image1 || !image2 || !prompt 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-200 hover:-translate-y-1 active:translate-y-0'}`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-6 h-6" />
                    Generate Image
                  </>
                )}
              </button>
              
              {(image1 || image2 || prompt || resultImage) && (
                <button
                  onClick={handleReset}
                  disabled={isGenerating}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 hover:text-slate-800"
                >
                  Reset
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Result Section */}
        {resultImage && (
          <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden scroll-mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700" id="result">
            <div className="h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400" />
            <div className="p-6 sm:p-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                  Result
                </h2>
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors border border-emerald-100"
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </button>
              </div>
              
              <div className="relative bg-slate-50/50 rounded-2xl overflow-hidden border border-slate-100 shadow-inner min-h-[400px] flex items-center justify-center p-2">
                <img 
                  src={resultImage} 
                  alt="Generated Result" 
                  className="w-full h-full object-contain max-h-[700px] rounded-lg shadow-sm" 
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-slate-400 text-sm pb-8">
          <p>© {new Date().getFullYear()} From 2 Image Get One. Powered by Google Gemini.</p>
        </footer>

      </div>
    </div>
  );
}