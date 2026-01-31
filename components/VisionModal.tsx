
import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Loader2, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { aiService } from '../services/aiService';
import Button from './ui/Button';

interface VisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksGenerated: (tasks: { title: string; description: string; subtasks: string[] }[]) => void;
}

const VisionModal: React.FC<VisionModalProps> = ({ isOpen, onClose, onTasksGenerated }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!previewUrl) return;

    setIsProcessing(true);
    try {
      const base64Data = previewUrl.split(',')[1];
      const mimeType = previewUrl.split(',')[0].split(':')[1].split(';')[0];
      const tasks = await aiService.parseImageToTasks(base64Data, mimeType);
      
      if (tasks.length > 0) {
        onTasksGenerated(tasks);
        onClose();
      } else {
        alert("No tasks could be identified in the image. Please try a clearer photo.");
      }
    } catch (error) {
      console.error(error);
      alert("Error processing image.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Snap-to-Task</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Gemini Vision Intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-10">
          {!previewUrl ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-16 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
            >
              <div className="p-6 bg-slate-50 rounded-full group-hover:scale-110 transition-transform">
                <Upload className="w-10 h-10 text-slate-300 group-hover:text-indigo-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-slate-900">Upload Whiteboard or Sketch</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">PNG, JPG or JPEG (Max 10MB)</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleFileSelect} 
              />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="relative rounded-[2rem] overflow-hidden border-4 border-slate-100 shadow-inner group">
                <img src={previewUrl} className="w-full h-64 object-cover" alt="Preview" />
                <button 
                  onClick={() => setPreviewUrl(null)}
                  className="absolute top-4 right-4 p-2 bg-slate-900/80 text-white rounded-xl hover:bg-rose-600 transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex gap-4">
                <div className="mt-0.5">
                  <AlertCircle className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                  Gemini will analyze this image to extract structured tasks and subtasks for your current project workspace.
                </p>
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  className="flex-1 py-4 rounded-2xl" 
                  onClick={() => setPreviewUrl(null)}
                  disabled={isProcessing}
                >
                  Change Image
                </Button>
                <Button 
                  variant="secondary" 
                  className="flex-[2] py-4 rounded-2xl" 
                  onClick={processImage}
                  isLoading={isProcessing}
                >
                  {isProcessing ? "Analyzing Workspace..." : "Extract Tasks"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisionModal;
