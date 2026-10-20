import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Globe, AlertCircle, CheckCircle2, RotateCcw, Volume2, Info, X, Sparkles } from 'lucide-react';

export type RecognitionLanguage = 'hi-IN' | 'en-IN' | 'en-US';

export interface VoiceInputControlProps {
  onTranscriptReceived: (transcript: string, mode: 'append' | 'replace') => void;
  currentText: string;
  fieldLabel?: string;
  placeholderHint?: string;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'success' | 'error';

// Preset realistic field patrol phrases for officers to test voice input effortlessly
const SAMPLE_PHRASES: Record<'hi-IN' | 'en-IN' | 'en-US', string[]> = {
  'hi-IN': [
    'मुख्य गेट का ताला टूटा हुआ पाया गया',
    'बाउंड्री वॉल पर फेंसिंग तार कटी हुई मिली',
    'रियर एग्जिट के पास संदिग्ध गतिविधि देखी गई',
    'पेरिमीटर लाइटिंग बंद है और अंधेरा है'
  ],
  'en-IN': [
    'Main entrance padlock was found tampered',
    'Boundary wall wire fencing damaged on north perimeter',
    'Suspicious vehicle noticed near rear gate',
    'Perimeter floodlights dysfunctional at east wing'
  ],
  'en-US': [
    'Padlock broken and security latch compromised',
    'Fencing damaged along outer perimeter',
    'Unauthorized vehicle parked near security post',
    'All perimeter checkpoints verified secure'
  ]
};

export const VoiceInputControl: React.FC<VoiceInputControlProps> = ({
  onTranscriptReceived,
  currentText,
  fieldLabel = 'Voice Input',
  placeholderHint = 'Tap mic to speak in Hindi or English...'
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [selectedLanguage, setSelectedLanguage] = useState<RecognitionLanguage>('hi-IN');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [interimText, setInterimText] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [showSamplePhrases, setShowSamplePhrases] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API availability
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const startListening = () => {
    setErrorMessage(null);
    setInterimText('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage(
        'Web Speech API is not supported in this browser. You can type manually or tap one of the quick patrol voice phrases below.'
      );
      setVoiceState('error');
      setShowSamplePhrases(true);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = selectedLanguage;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setVoiceState('listening');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        if (interimTranscript) {
          setInterimText(interimTranscript);
        }

        if (finalTranscript) {
          setInterimText('');
          setVoiceState('success');
          onTranscriptReceived(finalTranscript.trim(), 'append');
          setTimeout(() => {
            setVoiceState('idle');
          }, 2000);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[Rexon Voice Input] Speech recognition notice:', event.error);
        let errorMsg = 'Voice recognition encountered an issue. Tap microphone to retry or tap a phrase below.';

        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          errorMsg = 'Microphone access is blocked in this browser. Please allow microphone permission in browser settings, or use the quick patrol voice phrases below.';
          setShowSamplePhrases(true);
        } else if (event.error === 'no-speech') {
          errorMsg = 'No speech was detected. Please tap microphone and speak clearly.';
        } else if (event.error === 'audio-capture') {
          errorMsg = 'No microphone device was detected on this device.';
          setShowSamplePhrases(true);
        } else if (event.error === 'network') {
          errorMsg = 'Speech processing network timeout. Check connection or use manual text entry.';
        }

        setErrorMessage(errorMsg);
        setVoiceState('error');
      };

      recognition.onend = () => {
        if (voiceState === 'listening') {
          setVoiceState('idle');
        }
      };

      recognition.start();
    } catch (err: any) {
      console.warn('[Rexon Voice Input] Start exception:', err);
      setErrorMessage(
        'Could not access microphone in this frame. You can use quick phrases or type manually.'
      );
      setVoiceState('error');
      setShowSamplePhrases(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        setVoiceState('processing');
        recognitionRef.current.stop();
      } catch (e) {
        setVoiceState('idle');
      }
    } else {
      setVoiceState('idle');
    }
  };

  const handleSelectSamplePhrase = (phrase: string) => {
    onTranscriptReceived(phrase, 'append');
    setVoiceState('success');
    setErrorMessage(null);
    setTimeout(() => {
      setVoiceState('idle');
    }, 1800);
  };

  return (
    <div className="bg-[#FAF7F2] border border-[#E7DED2] rounded-xl p-2.5 sm:p-3 space-y-2 my-1.5 shadow-2xs">
      {/* Top Bar: Language Pills on Left & Responsive Mic Button on Right */}
      <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2">
        {/* Language Selection */}
        <div className="flex items-center gap-1.5 min-w-0">
          <Globe className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
          <span className="text-[11px] font-bold text-[#4B3621] shrink-0">
            Language:
          </span>
          <div className="flex items-center bg-[#FFFFFF] border border-[#E7DED2] rounded-lg p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedLanguage('hi-IN')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer select-none ${
                selectedLanguage === 'hi-IN'
                  ? 'bg-[#6F4E37] text-white shadow-2xs'
                  : 'text-[#8B735B] hover:text-[#4B3621] hover:bg-[#F0E8DD]'
              }`}
            >
              हिन्दी (Hindi)
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage('en-IN')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer select-none ${
                selectedLanguage === 'en-IN'
                  ? 'bg-[#6F4E37] text-white shadow-2xs'
                  : 'text-[#8B735B] hover:text-[#4B3621] hover:bg-[#F0E8DD]'
              }`}
            >
              English (IN)
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage('en-US')}
              className={`hidden sm:inline-block px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer select-none ${
                selectedLanguage === 'en-US'
                  ? 'bg-[#6F4E37] text-white shadow-2xs'
                  : 'text-[#8B735B] hover:text-[#4B3621] hover:bg-[#F0E8DD]'
              }`}
            >
              US
            </button>
          </div>
        </div>

        {/* Mic Action Button */}
        <div className="flex items-center gap-1.5 shrink-0 self-end xs:self-auto">
          {voiceState === 'listening' ? (
            <button
              type="button"
              onClick={stopListening}
              className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#C62828] hover:bg-[#B71C1C] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm animate-pulse cursor-pointer whitespace-nowrap"
            >
              <MicOff className="w-4 h-4 shrink-0" />
              <span>Stop Recording</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startListening}
              disabled={voiceState === 'processing'}
              className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 whitespace-nowrap"
              title="Tap to speak in Hindi or English"
            >
              <Mic className="w-4 h-4 text-[#F8F5EF] shrink-0" />
              <span>
                {selectedLanguage === 'hi-IN' ? 'माइक से बोलें (Speak)' : 'Speak Description'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowSamplePhrases((prev) => !prev)}
            className="p-2 rounded-lg bg-[#FFFFFF] hover:bg-[#F0E8DD] text-[#6F4E37] border border-[#E7DED2] text-xs transition-colors cursor-pointer"
            title="Toggle Quick Patrol Voice Phrases"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Voice Status & Interim Transcript Box */}
      {voiceState === 'listening' && (
        <div className="p-2.5 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-xs text-[#92400E] flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] animate-ping shrink-0" />
            <span className="font-semibold truncate">
              Listening in {selectedLanguage === 'hi-IN' ? 'हिन्दी (Hindi)' : 'English'}... Speak now.
            </span>
          </div>
          {interimText && (
            <span className="font-medium italic text-[#78350F] max-w-xs truncate shrink-0">
              "{interimText}"
            </span>
          )}
        </div>
      )}

      {voiceState === 'processing' && (
        <div className="p-2 rounded-lg bg-[#F0E8DD] text-xs text-[#4B3621] flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-[#6F4E37] animate-pulse shrink-0" />
          <span>Processing voice audio...</span>
        </div>
      )}

      {voiceState === 'success' && (
        <div className="p-2 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9] text-xs text-[#1B5E20] flex items-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
          <span>Speech recognized and added to text. You can edit or continue typing.</span>
        </div>
      )}

      {/* Non-intrusive voice helper or permission notification */}
      {voiceState === 'error' && errorMessage && (
        <div className="p-2.5 rounded-lg bg-[#FFF8E7] border border-[#FDE68A] text-xs text-[#92400E] space-y-1.5 animate-in fade-in relative">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-[#92400E]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#D97706]" />
              <span>Voice Input Status</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setVoiceState('idle');
                setErrorMessage(null);
              }}
              className="p-1 rounded text-[#8B735B] hover:text-[#4B3621] cursor-pointer"
              aria-label="Dismiss notice"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-[#78350F]">{errorMessage}</p>
        </div>
      )}

      {/* Quick Patrol Phrases (Preset Voice Simulation) */}
      {showSamplePhrases && (
        <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E7DED2] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#4B3621]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#6F4E37]" />
              <span>Quick Voice Phrases ({selectedLanguage === 'hi-IN' ? 'हिन्दी' : 'English'}):</span>
            </span>
            <span className="text-[10px] text-[#8B735B]">Tap to insert</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_PHRASES[selectedLanguage].map((phrase, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSamplePhrase(phrase)}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] text-left transition-colors cursor-pointer shadow-2xs hover:border-[#6F4E37]"
              >
                + "{phrase}"
              </button>
            ))}
          </div>
        </div>
      )}

      {!isSupported && (
        <div className="p-2 rounded-lg bg-[#F0E8DD] border border-[#E7DED2] text-[11px] text-[#8B735B] flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#6F4E37] shrink-0 mt-0.5" />
          <span>
            Speech recognition requires Web Speech API (supported in Google Chrome, Edge, and Android WebView). Manual typing is always supported in Hindi & English.
          </span>
        </div>
      )}
    </div>
  );
};
