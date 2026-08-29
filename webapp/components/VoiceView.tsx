"use client";

import { useEffect, useRef, useState } from "react";
import type { Subject } from "@prisma/client";
import { t, type Lang } from "@/lib/i18n";

type Msg = { id: string; role: string; content: string };

const RECOGNITION_LANG: Record<Lang, string> = { kk: "kk-KZ", ru: "ru-RU" };

export default function VoiceView({ lang, subjects }: { lang: Lang; subjects: Subject[] }) {
  const tt = t(lang);
  const [subjectCode, setSubjectCode] = useState(subjects[0]?.code ?? "math");
  const subjectCodeRef = useRef(subjectCode);
  subjectCodeRef.current = subjectCode;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef<any>(null);
  const fellBackRef = useRef(false);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }

    fellBackRef.current = false;
    const recognition = buildRecognition(SR, RECOGNITION_LANG[lang]);
    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onstart = null;
      try {
        recognition.abort();
      } catch {
        // already stopped
      }
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  function buildRecognition(SR: any, recogLang: string) {
    const recognition = new SR();
    recognition.lang = recogLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.__gotResult = false;
    recognition.__manualStop = false;
    recognition.__errorShown = false;

    recognition.onstart = () => {
      recognition.__gotResult = false;
      recognition.__manualStop = false;
      recognition.__errorShown = false;
      setListening(true);
    };
    recognition.onresult = (event: any) => {
      recognition.__gotResult = true;
      const transcript = event.results[0][0].transcript;
      handleUserSpeech(transcript);
    };
    recognition.onerror = (event: any) => handleRecognitionError(event?.error, SR, recognition);
    recognition.onend = () => {
      setListening(false);
      // Some browsers end a session silently (no error, no result) instead of firing
      // a "no-speech" error - surface that too, otherwise the mic button appears to
      // do nothing at all, which is the exact bug this fix addresses.
      if (!recognition.__gotResult && !recognition.__manualStop && !recognition.__errorShown) {
        setVoiceError(tt.voice.errorNoSpeech);
      }
    };
    return recognition;
  }

  function handleRecognitionError(errorCode: string, SR: any, recognition: any) {
    recognition.__errorShown = true;
    setListening(false);
    if (errorCode === "aborted") return;

    if (
      (errorCode === "language-not-supported" || errorCode === "language-not-available") &&
      lang === "kk" &&
      !fellBackRef.current
    ) {
      fellBackRef.current = true;
      const fallback = buildRecognition(SR, "ru-RU");
      recognitionRef.current = fallback;
      setVoiceError(tt.voice.errorLangFallback);
      try {
        fallback.start();
      } catch {
        setVoiceError(tt.voice.errorGeneric);
      }
      return;
    }

    const messages: Record<string, string> = {
      "not-allowed": tt.voice.errorMicDenied,
      "service-not-allowed": tt.voice.errorMicDenied,
      "audio-capture": tt.voice.errorNoMic,
      "no-speech": tt.voice.errorNoSpeech,
      network: tt.voice.errorNetwork,
      "language-not-supported": tt.voice.errorGeneric,
      "language-not-available": tt.voice.errorGeneric,
    };
    setVoiceError(messages[errorCode] ?? tt.voice.errorGeneric);
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === "ru" ? "ru-RU" : "kk-KZ";
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang.toLowerCase().startsWith(lang === "ru" ? "ru" : "kk"));
    if (match) utter.voice = match;
    else {
      const ru = voices.find((v) => v.lang.toLowerCase().startsWith("ru"));
      if (ru) utter.voice = ru;
    }
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  async function handleUserSpeech(transcript: string) {
    setMessages((m) => [...m, { id: "u-" + Date.now(), role: "user", content: transcript }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectCode: subjectCodeRef.current, message: transcript }),
      });
      if (!res.ok) {
        setVoiceError(tt.voice.errorGeneric);
        return;
      }
      const data = await res.json();
      setMessages((m) => [...m, { id: "a-" + Date.now(), role: "assistant", content: data.reply }]);
      speak(data.reply);
    } catch {
      setVoiceError(tt.voice.errorNetwork);
    }
  }

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.__manualStop = true;
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setVoiceError("");
      window.speechSynthesis?.cancel();
      try {
        recognitionRef.current.start();
      } catch {
        // already running - stop and let onend clear state, user can press again
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        setListening(false);
      }
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 md:py-10 flex flex-col items-center text-center">
      <h1 className="font-display font-bold text-2xl text-ink-900">{tt.voice.title}</h1>

      <div className="flex gap-2 mt-4 flex-wrap justify-center">
        {subjects.map((s) => (
          <button
            key={s.code}
            onClick={() => setSubjectCode(s.code)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              subjectCode === s.code ? "bg-gold-500 border-gold-500 text-ink-900" : "border-ink-200 text-ink-600"
            }`}
          >
            {lang === "ru" ? s.nameRu : s.nameKk}
          </button>
        ))}
      </div>

      {!supported && <p className="text-sm text-red-500 mt-8 max-w-sm">{tt.voice.notSupported}</p>}

      {supported && (
        <>
          <button
            onClick={toggleListening}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center mt-10 transition-colors ${
              listening ? "bg-red-500" : "bg-gradient-to-br from-gold-400 to-leaf-500"
            }`}
          >
            {listening && <span className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping" />}
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#1C140C" strokeWidth="1.8">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0014 0M12 18v3m-3.5 0h7" />
            </svg>
          </button>

          <p className="text-sm text-ink-500 mt-4">{listening ? tt.voice.listening : speaking ? tt.voice.speaking : tt.voice.start}</p>

          {voiceError && <p className="text-sm text-red-500 mt-2 max-w-sm">{voiceError}</p>}

          <div className="w-full mt-8 space-y-3 text-left">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user" ? "ml-auto bg-gold-500 text-ink-900" : "bg-white shadow-card text-ink-700"
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
