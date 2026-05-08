export class LoadingScreen {
  private container: HTMLDivElement;
  private progressBar: HTMLDivElement;
  private percentLabel: HTMLSpanElement;

  constructor() {
    this.container     = document.createElement("div");
    this.progressBar   = document.createElement("div");
    this.percentLabel  = document.createElement("span");
    this._build();
  }

  private _build(): void {
    Object.assign(this.container.style, {
      position:        "fixed",
      inset:           "0",
      background:      "#0a0a0f",
      display:         "flex",
      flexDirection:   "column",
      alignItems:      "center",
      justifyContent:  "center",
      gap:             "32px",
      fontFamily:      "monospace",
      color:           "#e0e0e0",
      zIndex:          "100",
      transition:      "opacity 0.6s ease",
    });

    // ── Título ──────────────────────────────────────────────────
    const title = document.createElement("h1");
    title.textContent = "MY GAME";
    Object.assign(title.style, {
      fontSize:      "3rem",
      letterSpacing: "0.4em",
      color:         "#ffffff",
      margin:        "0",
      textTransform: "uppercase",
    });

    // ── Barra de progreso ───────────────────────────────────────
    const track = document.createElement("div");
    Object.assign(track.style, {
      width:        "340px",
      height:       "4px",
      background:   "#1e1e2e",
      borderRadius: "2px",
      overflow:     "hidden",
    });

    Object.assign(this.progressBar.style, {
      width:        "0%",
      height:       "100%",
      background:   "#6c63ff",
      borderRadius: "2px",
      transition:   "width 0.2s ease",
    });

    track.appendChild(this.progressBar);

    // ── Porcentaje ──────────────────────────────────────────────
    Object.assign(this.percentLabel.style, {
      fontSize: "0.85rem",
      color:    "#888",
    });
    this.percentLabel.textContent = "0%";

    // ── Controles ───────────────────────────────────────────────
    const controls = document.createElement("div");
    Object.assign(controls.style, {
      display:       "flex",
      gap:           "24px",
      marginTop:     "16px",
      fontSize:      "0.75rem",
      color:         "#555",
      letterSpacing: "0.05em",
    });

    const keys = [
      { key: "W A S D", action: "Mover" },
      { key: "SPACE",   action: "Saltar" },
      { key: "SHIFT",   action: "Correr" },
      { key: "ESC",     action: "Pausa"  },
    ];

    keys.forEach(({ key, action }) => {
      const item = document.createElement("div");
      item.style.textAlign = "center";
      item.innerHTML = `
        <span style="
          display: block;
          background: #1a1a2e;
          border: 1px solid #333;
          border-radius: 4px;
          padding: 4px 10px;
          margin-bottom: 6px;
          color: #aaa;
          font-size: 0.8rem;
        ">${key}</span>
        <span style="color: #555">${action}</span>
      `;
      controls.appendChild(item);
    });

    this.container.append(title, track, this.percentLabel, controls);
    document.body.appendChild(this.container);
  }

  setProgress(percent: number): void {
    const clamped = Math.min(100, Math.max(0, percent));
    this.progressBar.style.width    = `${clamped}%`;
    this.percentLabel.textContent   = `${Math.floor(clamped)}%`;
  }

  hide(): void {
    this.container.style.opacity = "0";
    setTimeout(() => this.container.remove(), 600);
  }
}