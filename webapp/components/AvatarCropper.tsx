"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CANVAS_SIZE = 320;
const OUTPUT_SIZE = 480;

export default function AvatarCropper({
  currentAvatarUrl,
  fallbackLetter,
  labels,
  onSaved,
}: {
  currentAvatarUrl: string | null;
  fallbackLetter: string;
  labels: {
    change: string;
    remove: string;
    save: string;
    cancel: string;
    zoom: string;
    uploading: string;
    errorType: string;
    errorSize: string;
  };
  onSaved?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [editing, setEditing] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.save();
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = "#F2ECE1";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const baseSize = Math.max(img.width, img.height);
    const fitScale = CANVAS_SIZE / Math.min(img.width, img.height);
    const drawW = img.width * fitScale * scale;
    const drawH = img.height * fitScale * scale;
    const cx = CANVAS_SIZE / 2 + offset.x;
    const cy = CANVAS_SIZE / 2 + offset.y;

    ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = "#E38B1F";
    ctx.lineWidth = 2;
    ctx.stroke();
    void baseSize;
  }, [scale, offset]);

  useEffect(() => {
    if (editing) draw();
  }, [editing, draw]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(labels.errorType);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(labels.errorSize);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setScale(1);
      setOffset({ x: 0, y: 0 });
      setEditing(true);
    };
    img.src = url;
    e.target.value = "";
  }

  function onPointerDown(e: React.PointerEvent) {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }
  function onPointerUp() {
    setDragging(false);
  }

  async function save() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    setSaving(true);
    setError(null);

    const out = document.createElement("canvas");
    out.width = OUTPUT_SIZE;
    out.height = OUTPUT_SIZE;
    const ctx = out.getContext("2d")!;
    const ratio = OUTPUT_SIZE / CANVAS_SIZE;
    ctx.save();
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    const fitScale = (CANVAS_SIZE / Math.min(img.width, img.height)) * ratio;
    const drawW = img.width * fitScale * scale;
    const drawH = img.height * fitScale * scale;
    const cx = OUTPUT_SIZE / 2 + offset.x * ratio;
    const cy = OUTPUT_SIZE / 2 + offset.y * ratio;
    ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
    ctx.restore();

    out.toBlob(
      async (blob) => {
        if (!blob) {
          setSaving(false);
          return;
        }
        const fd = new FormData();
        fd.append("file", blob, "avatar.jpg");
        const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
        setSaving(false);
        if (!res.ok) {
          setError(labels.errorType);
          return;
        }
        setAvatarUrl(URL.createObjectURL(blob));
        setEditing(false);
        onSaved?.();
      },
      "image/jpeg",
      0.9
    );
  }

  async function removeAvatar() {
    await fetch("/api/profile/avatar", { method: "DELETE" });
    setAvatarUrl(null);
    onSaved?.();
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gold-200 flex items-center justify-center shrink-0 border-2 border-white shadow-card">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-display font-bold text-2xl text-ink-800">{fallbackLetter}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost h-10 px-4 text-sm">
            {labels.change}
          </button>
          {avatarUrl && (
            <button type="button" onClick={removeAvatar} className="text-sm text-red-500 font-semibold hover:underline">
              {labels.remove}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
      </div>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      {editing && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="mx-auto rounded-full touch-none cursor-grab active:cursor-grabbing"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            />
            <label className="block text-xs text-ink-500 mt-4 mb-1">{labels.zoom}</label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => {
                setScale(Number(e.target.value));
                requestAnimationFrame(draw);
              }}
              className="w-full accent-gold-500"
            />
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost h-11 flex-1 text-sm">
                {labels.cancel}
              </button>
              <button type="button" onClick={save} disabled={saving} className="btn btn-primary h-11 flex-1 text-sm disabled:opacity-60">
                {saving ? labels.uploading : labels.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
