
import React, { useState, useRef } from 'react';
import { X, Camera, Upload, AlertCircle } from 'lucide-react';
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
        alert("Velo AI could not identify structured nodes in this scan.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
          <div className="flex items-center gap-4">
            <Camera className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-black text-slate-900">Snap-to-Task</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-10">
          {!previewUrl ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-16 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-indigo-200 transition-all group"
            >
              <Upload className="w-10 h-10 text-slate-300 group-hover:text-indigo-500" />
              <p className="text-sm font-black text-slate-900">Upload Whiteboard or Sketch</p>
              <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleFileSelect} />
            </div>
          ) : (
            <div className="space-y-8">
              <img src={previewUrl} className="w-full h-64 object-cover rounded-[2rem]" alt="Preview" />
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex gap-4">
                <div className="mt-0.5">
                  <AlertCircle className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                  Velo AI will analyze this image to extract structured tasks and subtasks for your current workspace.
                </p>
              </div>
              <Button 
                variant="secondary" 
                className="w-full py-4 rounded-2xl shadow-xl shadow-indigo-100" 
                onClick={processImage}
                isLoading={isProcessing}
              >
                {isProcessing ? "Velo AI is processing..." : "Extract Strategy Nodes"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisionModal;
