"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Lesson, Topic, Subject } from "@prisma/client";
import { t, type Lang } from "@/lib/i18n";

type Props = {
  lang: Lang;
  topic: Topic & { subject: Subject };
  lessons: Lesson[];
};

export default function LessonView({ lang, topic, lessons }: Props) {
  const tt = t(lang);
  const router = useRouter();
  const [lessonIdx, setLessonIdx] = useState(0);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<{ correct: boolean; xpGain: number } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const lesson = lessons[lessonIdx];
  const totalSteps = 3;
  const stepLabels = [tt.lesson.theory, tt.lesson.example, tt.lesson.practice];

  const title = lang === "ru" ? topic.titleRu : topic.titleKk;
  const theory = lang === "ru" ? lesson.theoryRu : lesson.theoryKk;
  const example = lang === "ru" ? lesson.exampleRu : lesson.exampleKk;
  const question = lang === "ru" ? lesson.practiceQuestionRu : lesson.practiceQuestionKk;
  const hint = lang === "ru" ? lesson.hintRu : lesson.hintKk;

  async function submitAnswer() {
    setSubmitting(true);
    const res = await fetch(`/api/lesson/${topic.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, lessonOrder: lesson.order }),
    });
    setSubmitting(false);
    if (!res.ok) return;
    const data = await res.json();
    setResult({ correct: data.correct, xpGain: data.xpGain });
  }

  function goNext() {
    if (lessonIdx + 1 < lessons.length) {
      setLessonIdx(lessonIdx + 1);
      setStep(0);
      setAnswer("");
      setResult(null);
      setShowHint(false);
    } else {
      router.push("/student/home");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <Link href="/student/home" className="text-sm text-ink-500 hover:text-gold-600">
        ← {tt.lesson.backToSubjects}
      </Link>

      <h1 className="font-display font-bold text-2xl text-ink-900 mt-2">{title}</h1>
      <p className="text-sm text-ink-500">
        {tt.lesson.step} {step + 1}/{totalSteps} — {stepLabels[step]}
      </p>

      <div className="mt-3 h-1.5 rounded-full bg-ink-100 overflow-hidden">
        <div
          className="h-1.5 rounded-full bg-gold-500 transition-all duration-300"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <div className="card p-6 md:p-8 mt-6">
        {step === 0 && (
          <>
            <h2 className="font-display font-bold text-lg text-ink-900 mb-3">{tt.lesson.theory}</h2>
            <p className="text-ink-700 leading-relaxed whitespace-pre-line">{theory}</p>
            <button onClick={() => setStep(1)} className="btn btn-primary h-11 px-6 mt-6">
              {tt.lesson.next}
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="font-display font-bold text-lg text-ink-900 mb-3">{tt.lesson.example}</h2>
            <p className="text-ink-700 leading-relaxed whitespace-pre-line">{example}</p>
            <button onClick={() => setStep(2)} className="btn btn-primary h-11 px-6 mt-6">
              {tt.lesson.next}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-display font-bold text-lg text-ink-900 mb-3">{tt.lesson.practice}</h2>
            <p className="text-ink-700 leading-relaxed mb-4">{question}</p>

            {!result && (
              <>
                <input
                  className="w-full h-12 rounded-xl border border-ink-200 px-4 focus:border-gold-500 outline-none"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={tt.lesson.yourAnswer}
                />
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  <button onClick={submitAnswer} disabled={submitting || !answer} className="btn btn-primary h-11 px-6 disabled:opacity-60">
                    {tt.lesson.check}
                  </button>
                  <button type="button" onClick={() => setShowHint((v) => !v)} className="text-sm font-semibold text-gold-600 hover:underline">
                    {tt.lesson.showHint}
                  </button>
                </div>
                {showHint && (
                  <p className="text-sm text-ink-500 mt-3 bg-gold-50 rounded-xl p-3 flex items-start gap-2">
                    <svg viewBox="0 0 24 24" width="16" height="16" className="text-gold-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0012 3z" />
                    </svg>
                    <span>{hint}</span>
                  </p>
                )}
              </>
            )}

            {result && (
              <div className={`rounded-2xl p-4 ${result.correct ? "bg-leaf-50 border border-leaf-200" : "bg-red-50 border border-red-200"}`}>
                <p className={`font-semibold ${result.correct ? "text-leaf-700" : "text-red-600"}`}>
                  {result.correct ? tt.lesson.correct : tt.lesson.incorrect}
                </p>
                {result.correct && (
                  <p className="text-sm text-ink-500 mt-1">
                    +{result.xpGain} {tt.lesson.xpEarned}
                  </p>
                )}
                <div className="flex gap-3 mt-4">
                  {!result.correct && (
                    <button
                      onClick={() => {
                        setResult(null);
                        setAnswer("");
                      }}
                      className="btn btn-ghost h-10 px-5 text-sm"
                    >
                      {tt.lesson.check}
                    </button>
                  )}
                  <button onClick={goNext} className="btn btn-primary h-10 px-5 text-sm">
                    {tt.lesson.next}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
