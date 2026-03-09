import { useEffect, useRef, useState } from "react";

type Variant = {
  label: string;
  filename: string;
  bgColor: string | null;
  textColor: string;
};

const logoVariants: Variant[] = [
  { label: "Black on White", filename: "luxvibe-logo-black-on-white.png", bgColor: "#ffffff", textColor: "#000000" },
  { label: "White on Black", filename: "luxvibe-logo-white-on-black.png", bgColor: "#000000", textColor: "#ffffff" },
  { label: "White – Transparent BG", filename: "luxvibe-logo-white-transparent.png", bgColor: null, textColor: "#ffffff" },
  { label: "Black – Transparent BG", filename: "luxvibe-logo-black-transparent.png", bgColor: null, textColor: "#000000" },
];

const monogramVariants: Variant[] = [
  { label: "Black on White", filename: "luxvibe-monogram-black-on-white.png", bgColor: "#ffffff", textColor: "#000000" },
  { label: "White on Black", filename: "luxvibe-monogram-white-on-black.png", bgColor: "#000000", textColor: "#ffffff" },
  { label: "White – Transparent BG", filename: "luxvibe-monogram-white-transparent.png", bgColor: null, textColor: "#ffffff" },
  { label: "Black – Transparent BG", filename: "luxvibe-monogram-black-transparent.png", bgColor: null, textColor: "#000000" },
];

const checkerboard: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0,0 10px,10px -10px,-10px 0px",
  backgroundColor: "#fff",
};

function AssetCanvas({
  variant,
  width,
  height,
  text,
  fontSize,
  letterSpacing,
}: {
  variant: Variant;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  letterSpacing: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      if (variant.bgColor) {
        ctx.fillStyle = variant.bgColor;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.fillStyle = variant.textColor;
      ctx.font = `600 ${fontSize}px 'Cormorant Garamond', serif`;
      (ctx as any).letterSpacing = `${letterSpacing}px`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, width / 2, height / 2);
    };

    document.fonts.ready.then(draw);
  }, [variant, width, height, text, fontSize, letterSpacing]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = variant.filename;
    a.click();
    a.remove();
  };

  return (
    <div style={{ borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
      <div style={{ position: "relative" }}>
        {!variant.bgColor && (
          <div style={{ ...checkerboard, position: "absolute", inset: 0 }} />
        )}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ width: "100%", display: "block", position: "relative" }}
        />
      </div>
      <div style={{ background: "#f0f0f0", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "12px", color: "#555", fontWeight: 600 }}>{variant.label}</span>
        <button
          onClick={handleDownload}
          style={{
            fontSize: "12px",
            fontWeight: 600,
            padding: "5px 14px",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#333")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#111")}
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}

function CircleProfileCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const SIZE = 400;

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, SIZE, SIZE);

      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
      ctx.fillStyle = "#000000";
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = `600 220px 'Cormorant Garamond', serif`;
      (ctx as any).letterSpacing = "12px";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("LV", SIZE / 2 + 6, SIZE / 2 + 22);

      setReady(true);
    };
    document.fonts.ready.then(draw);
  }, []);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "luxvibe-lv-profile-400x400.png";
    a.click();
    a.remove();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
      <div style={{ borderRadius: "50%", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.18)", width: 200, height: 200 }}>
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          style={{ width: "200px", height: "200px", display: "block" }}
        />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "#555", margin: "0 0 12px" }}>400 × 400 px &nbsp;·&nbsp; Black circle &nbsp;·&nbsp; White LV</p>
        <button
          onClick={handleDownload}
          disabled={!ready}
          style={{
            fontSize: "14px",
            fontWeight: 700,
            padding: "10px 28px",
            background: ready ? "#000" : "#999",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: ready ? "pointer" : "default",
            letterSpacing: "0.04em",
          }}
          onMouseOver={(e) => { if (ready) e.currentTarget.style.background = "#333"; }}
          onMouseOut={(e) => { if (ready) e.currentTarget.style.background = "#000"; }}
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}

function OffsetMonogramCanvas({
  bgColor,
  fgColor,
  circle,
  filename,
  label,
  previewSize = 200,
  fontSize: fontSizeProp = 340,
  lPos = [0.408, 0.570],
  vPos = [0.592, 0.430],
}: {
  bgColor: string;
  fgColor: string;
  circle: boolean;
  filename: string;
  label: string;
  previewSize?: number;
  fontSize?: number;
  lPos?: [number, number];
  vPos?: [number, number];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const SIZE = 800;

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, SIZE, SIZE);

      const fontSize = fontSizeProp;
      const lX = SIZE * lPos[0];
      const lY = SIZE * lPos[1];
      const vX = SIZE * vPos[0];
      const vY = SIZE * vPos[1];
      const font = `600 ${fontSize}px 'Cormorant Garamond', serif`;

      if (circle) {
        ctx.beginPath();
        ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
        ctx.fillStyle = bgColor;
        ctx.fill();
        ctx.save();
        ctx.clip();
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, SIZE, SIZE);
      }

      const lOff = document.createElement("canvas");
      lOff.width = SIZE; lOff.height = SIZE;
      const lCtx = lOff.getContext("2d")!;
      lCtx.fillStyle = fgColor;
      lCtx.font = font;
      (lCtx as any).letterSpacing = "0px";
      lCtx.textAlign = "center";
      lCtx.textBaseline = "middle";
      lCtx.fillText("L", lX, lY);

      const vOff = document.createElement("canvas");
      vOff.width = SIZE; vOff.height = SIZE;
      const vCtx = vOff.getContext("2d")!;
      vCtx.fillStyle = fgColor;
      vCtx.font = font;
      (vCtx as any).letterSpacing = "0px";
      vCtx.textAlign = "center";
      vCtx.textBaseline = "middle";
      vCtx.fillText("V", vX, vY);

      lCtx.globalCompositeOperation = "destination-out";
      lCtx.drawImage(vOff, 0, 0);

      ctx.drawImage(lOff, 0, 0);
      ctx.drawImage(vOff, 0, 0);

      if (circle) ctx.restore();

      setReady(true);
    };
    document.fonts.ready.then(draw);
  }, [bgColor, fgColor, circle, fontSizeProp, lPos, vPos]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    a.remove();
  };

  const previewStyle: React.CSSProperties = circle
    ? { borderRadius: "50%", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.18)", width: previewSize, height: previewSize }
    : { borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.14)", width: previewSize, height: previewSize };

  const transparentBg = bgColor === "transparent";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
      <div style={{ ...previewStyle, ...(transparentBg ? checkerboard : {}) }}>
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          style={{ width: previewSize, height: previewSize, display: "block" }}
        />
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "#666", margin: "0 0 10px", fontWeight: 600 }}>{label}</p>
        <button
          onClick={handleDownload}
          disabled={!ready}
          style={{
            fontSize: "12px",
            fontWeight: 700,
            padding: "7px 20px",
            background: ready ? "#000" : "#999",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: ready ? "pointer" : "default",
            letterSpacing: "0.04em",
          }}
          onMouseOver={(e) => { if (ready) e.currentTarget.style.background = "#333"; }}
          onMouseOut={(e) => { if (ready) e.currentTarget.style.background = "#000"; }}
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}

export default function LogoAssets() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "40px", maxWidth: "1100px", margin: "0 auto", background: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ background: "#fff", borderRadius: "12px", padding: "32px", marginBottom: "32px", border: "1px solid #e0e0e0" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Luxvibe Logo Assets</h1>
        <p style={{ color: "#555", marginBottom: "4px" }}>
          <strong>Font:</strong> Cormorant Garamond — Semibold (600), Uppercase, Letter-spacing 0.18em
        </p>
        <p style={{ color: "#555", marginBottom: "4px" }}>
          <strong>Monogram font:</strong> Same — Cormorant Garamond Semibold, Letter-spacing 0.08em
        </p>
        <p style={{ color: "#555", marginBottom: "0" }}>
          <strong>Downloads:</strong> Full logo exports at 2400×800 px. Monogram exports at 800×800 px. Checkerboard pattern indicates a transparent background.
        </p>
      </div>

      <div style={{ background: "#fff", borderRadius: "12px", padding: "40px", marginBottom: "40px", border: "1px solid #e0e0e0", textAlign: "center" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "6px" }}>Social Media Profile Photo</h2>
        <p style={{ color: "#555", fontSize: "13px", marginBottom: "28px" }}>400 × 400 px — optimised for Instagram, X, LinkedIn and Facebook profile pictures</p>
        <CircleProfileCanvas />
      </div>

      <div style={{ background: "#fff", borderRadius: "12px", padding: "40px", marginBottom: "40px", border: "1px solid #e0e0e0" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>Offset Interlocking Monogram — 800 × 800</h2>
        <p style={{ color: "#555", fontSize: "13px", marginBottom: "32px" }}>Diagonal offset with V in front of L — classic luxury typographic interlock</p>
        <p style={{ color: "#888", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>Diagonal — L lower-left · V upper-right</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "32px", justifyItems: "center", marginBottom: "40px" }}>
          <OffsetMonogramCanvas bgColor="#ffffff" fgColor="#000000" circle={false} filename="luxvibe-offset-monogram-black-on-white.png" label="Black on White" />
          <OffsetMonogramCanvas bgColor="#000000" fgColor="#ffffff" circle={false} filename="luxvibe-offset-monogram-white-on-black.png" label="White on Black" />
          <OffsetMonogramCanvas bgColor="#000000" fgColor="#ffffff" circle={true}  filename="luxvibe-offset-monogram-circle-black.png"   label="Circle — Black" />
          <OffsetMonogramCanvas bgColor="#ffffff" fgColor="#000000" circle={true}  filename="luxvibe-offset-monogram-circle-white.png"   label="Circle — White" />
        </div>

        <p style={{ color: "#888", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>Vertical — L upper · V lower · Larger</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "32px", justifyItems: "center" }}>
          <OffsetMonogramCanvas bgColor="#ffffff" fgColor="#000000" circle={false} filename="luxvibe-offset-v2-black-on-white.png" label="Black on White" fontSize={390} lPos={[0.44, 0.375]} vPos={[0.56, 0.625]} />
          <OffsetMonogramCanvas bgColor="#000000" fgColor="#ffffff" circle={false} filename="luxvibe-offset-v2-white-on-black.png" label="White on Black" fontSize={390} lPos={[0.44, 0.375]} vPos={[0.56, 0.625]} />
          <OffsetMonogramCanvas bgColor="#000000" fgColor="#ffffff" circle={true}  filename="luxvibe-offset-v2-circle-black.png"   label="Circle — Black" fontSize={390} lPos={[0.44, 0.375]} vPos={[0.56, 0.625]} />
          <OffsetMonogramCanvas bgColor="#ffffff" fgColor="#000000" circle={true}  filename="luxvibe-offset-v2-circle-white.png"   label="Circle — White" fontSize={390} lPos={[0.44, 0.375]} vPos={[0.56, 0.625]} />
        </div>
      </div>

      <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>Full Logo — 2400 × 800</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "48px" }}>
        {logoVariants.map((v) => (
          <AssetCanvas
            key={v.filename}
            variant={v}
            width={2400}
            height={800}
            text="LUXVIBE"
            fontSize={220}
            letterSpacing={40}
          />
        ))}
      </div>

      <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>Monogram — 800 × 800</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px", marginBottom: "48px" }}>
        {monogramVariants.map((v) => (
          <AssetCanvas
            key={v.filename}
            variant={v}
            width={800}
            height={800}
            text="LV"
            fontSize={300}
            letterSpacing={25}
          />
        ))}
      </div>

      <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: "8px", padding: "16px 20px", fontSize: "13px", color: "#856404" }}>
        <strong>Note:</strong> Each PNG downloads at full resolution (2400×800 or 800×800). Transparent background variants have no background layer — the checkerboard shown is for display only and will not appear in the downloaded file.
      </div>
    </div>
  );
}
