
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';
import { Mic, MicOff, X, Activity, Bot, Loader2, Sparkles, Volume2 } from 'lucide-react';
import { Task } from '../types';

interface VoiceCommanderProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

const VoiceCommander: React.FC<VoiceCommanderProps> = ({ isOpen, onClose, tasks }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isListening, setIsListening] = useState(false);

  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    if (!isOpen && isActive) {
      stopSession();
    }
  }, [isOpen]);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const createBlob = (data: Float32Array): Blob => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startSession = async () => {
    setIsConnecting(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            setIsListening(true);
            
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => prev + message.serverContent!.outputTranscription!.text);
            }
            if (message.serverContent?.turnComplete) {
              setTranscription('');
            }
          },
          onerror: (e) => {
            console.error("Live API Error:", e);
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          outputAudioTranscription: {},
          systemInstruction: `You are the CloudTasks Project Commander. You have access to the following board state: ${JSON.stringify(tasks.map(t => ({ title: t.title, status: t.status, priority: t.priority })))}. Speak naturally, provide rapid updates, and suggest improvements. Keep responses concise.`
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setIsActive(false);
    setIsListening(false);
    setIsConnecting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
        <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isActive ? 'bg-indigo-500 animate-pulse' : 'bg-slate-800'}`}>
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Project Commander</h2>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Live Intelligence Core</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-12 flex flex-col items-center text-center">
          <div className="relative mb-12">
            {isActive ? (
              <div className="flex items-center justify-center gap-1.5 h-16 w-48">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-2 bg-indigo-500 rounded-full animate-bounce" 
                    style={{ 
                      height: `${30 + Math.random() * 70}%`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="w-24 h-24 bg-slate-50 border-4 border-slate-100 rounded-full flex items-center justify-center text-slate-200">
                <MicOff className="w-10 h-10" />
              </div>
            )}
            
            {isConnecting && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            )}
          </div>

          <div className="space-y-4 max-w-xs">
            {isActive ? (
              <>
                <p className="text-lg font-black text-slate-900">Listening to your command...</p>
                <p className="text-sm text-slate-500 font-medium">Try: "Summarize my high priority tasks" or "What's the status of the roadmap?"</p>
                <div className="h-6 overflow-hidden">
                  <p className="text-xs font-bold text-indigo-600 italic animate-pulse">{transcription}</p>
                </div>
              </>
            ) : (
              <>
                <p className="text-lg font-black text-slate-900">Synchronized Voice Hub</p>
                <p className="text-sm text-slate-500 font-medium">Initiate a real-time audio session with Gemini to manage your board hands-free.</p>
              </>
            )}
          </div>

          <div className="mt-12 flex w-full gap-4">
            {isActive ? (
              <button 
                onClick={stopSession}
                className="flex-1 py-4 bg-rose-50 text-rose-600 rounded-[1.5rem] border border-rose-100 font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-lg shadow-rose-100/50"
              >
                Disconnect
              </button>
            ) : (
              <button 
                onClick={startSession}
                disabled={isConnecting}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isConnecting ? "Handshaking..." : <><Mic className="w-5 h-5" /> Start Transmission</>}
              </button>
            )}
          </div>
        </div>

        <div className="px-12 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ultra-low latency powered by Gemini 2.5 Flash</span>
        </div>
      </div>
    </div>
  );
};

export default VoiceCommander;
