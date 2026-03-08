export default function LogoAssets() {
  const logoStyle: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 600,
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    lineHeight: 1,
  };

  const monogramStyle: React.CSSProperties = {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    lineHeight: 1,
  };

  const checkerboard: React.CSSProperties = {
    backgroundImage:
      "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
    backgroundSize: "20px 20px",
    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
    backgroundColor: "#fff",
  };

  const variants: {
    label: string;
    bg: string | React.CSSProperties;
    color: string;
    border?: string;
  }[] = [
    { label: "Black on White", bg: "#ffffff", color: "#000000", border: "1px solid #e0e0e0" },
    { label: "White on Black", bg: "#000000", color: "#ffffff" },
    { label: "White on Transparent", bg: checkerboard, color: "#ffffff" },
    { label: "Black on Transparent", bg: checkerboard, color: "#000000" },
  ];

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
          <strong>Canva tip:</strong> Search "Cormorant Garamond" in Canva's font picker. Set weight to Bold or use the closest available weight. Apply uppercase, wide letter spacing. For transparent backgrounds, export as PNG with "Transparent background" enabled.
        </p>
      </div>

      <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>Full Logo — 3:1 ratio (2400 × 800)</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "48px" }}>
        {variants.map((v) => (
          <div key={v.label} style={{ borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <div
              style={{
                ...(typeof v.bg === "string" ? { background: v.bg } : v.bg),
                border: v.border || "none",
                aspectRatio: "3 / 1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px 8px 0 0",
              }}
            >
              <span style={{ ...logoStyle, color: v.color, fontSize: "clamp(28px, 4vw, 64px)" }}>
                Luxvibe
              </span>
            </div>
            <div style={{ background: "#f0f0f0", padding: "8px 12px", fontSize: "12px", color: "#555", fontWeight: 600 }}>
              {v.label}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>Monogram — LV (Square)</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px", marginBottom: "48px" }}>
        {variants.map((v) => (
          <div key={v.label} style={{ borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <div
              style={{
                ...(typeof v.bg === "string" ? { background: v.bg } : v.bg),
                border: v.border || "none",
                aspectRatio: "1 / 1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px 8px 0 0",
              }}
            >
              <span style={{ ...monogramStyle, color: v.color, fontSize: "clamp(36px, 5vw, 80px)" }}>
                LV
              </span>
            </div>
            <div style={{ background: "#f0f0f0", padding: "8px 12px", fontSize: "12px", color: "#555", fontWeight: 600 }}>
              {v.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: "8px", padding: "16px 20px", fontSize: "13px", color: "#856404" }}>
        <strong>How to export with transparent background from Canva:</strong> When downloading, choose PNG format and tick the "Transparent background" checkbox. The checkerboard pattern above represents transparent areas — it won't appear in the exported file.
      </div>
    </div>
  );
}
