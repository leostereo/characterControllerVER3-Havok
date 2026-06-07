import { controlsConfig } from "@/config/GameConfig";

export class LoadingScreen {
  private container:    HTMLDivElement;
  private progressWrap: HTMLDivElement;
  private progressBar:  HTMLDivElement;
  private percentLabel: HTMLSpanElement;
  private splashWrap:   HTMLDivElement;

  constructor() {
    this.container    = document.createElement("div");
    this.progressWrap = document.createElement("div");
    this.progressBar  = document.createElement("div");
    this.percentLabel = document.createElement("span");
    this.splashWrap   = document.createElement("div");
    this._build();
  }

  private _build(): void {
    // ── Contenedor principal ────────────────────────────────────
    Object.assign(this.container.style, {
      position:       "fixed",
      inset:          "0",
      background:     "linear-gradient(160deg, #0a0a0f 60%, #12102a 100%)",
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      gap:            "32px",
      fontFamily:     "monospace",
      color:          "#e0e0e0",
      zIndex:         "100",
    });

    // ── Título (siempre visible) ─────────────────────────────────
    const title = document.createElement("h1");
    title.textContent = "Space Freesbe";
    Object.assign(title.style, {
      fontSize:      "3.5rem",
      letterSpacing: "0.5em",
      color:         "#ffffff",
      margin:        "0",
      textTransform: "uppercase",
    });

    // ── Sección de progreso ─────────────────────────────────────
    Object.assign(this.progressWrap.style, {
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      gap:            "12px",
      opacity:        "1",
      transition:     "opacity 0.4s ease",
    });

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

    Object.assign(this.percentLabel.style, {
      fontSize: "0.85rem",
      color:    "#888",
    });
    this.percentLabel.textContent = "0%";

    track.appendChild(this.progressBar);
    this.progressWrap.append(track, this.percentLabel);

    // ── Sección splash (controles + press any key) ──────────────
    Object.assign(this.splashWrap.style, {
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      gap:            "24px",
      opacity:        "0",
      transition:     "opacity 0.4s ease",
      pointerEvents:  "none",
    });

    const grid = document.createElement("div");
    Object.assign(grid.style, {
      display:             "grid",
      gridTemplateColumns: "auto auto",
      gap:                 "10px 32px",
      fontSize:            "0.82rem",
    });

    const controls = controlsConfig.keys;

    controls.forEach(({ key, action }) => {
      const keyEl = document.createElement("span");
      keyEl.textContent = key;
      Object.assign(keyEl.style, {
        background:   "#1a1a2e",
        border:       "1px solid #2a2a4a",
        borderRadius: "4px",
        padding:      "3px 10px",
        color:        "#aaa",
        textAlign:    "center",
        fontSize:     "0.78rem",
      });

      const actionEl = document.createElement("span");
      actionEl.textContent = action;
      actionEl.style.color = "#666";

      grid.append(keyEl, actionEl);
    });

    const prompt = document.createElement("p");
    prompt.textContent = "PRESS ANY KEY TO CONTINUE (or doble TAB)";
    Object.assign(prompt.style, {
      fontSize:      "0.75rem",
      letterSpacing: "0.3em",
      color:         "#6c63ff",
      margin:        "0",
      animation:     "blink 1.4s ease-in-out infinite",
    });

    if (!document.getElementById("screen-styles")) {
      const style = document.createElement("style");
      style.id = "screen-styles";
      style.textContent = `
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
      `;
      document.head.appendChild(style);
    }

    this.splashWrap.append(grid, prompt);
    this.container.append(title, this.progressWrap, this.splashWrap);
    document.body.appendChild(this.container);

    // ── Event listener para click (una sola vez) ─────────────────
    this.container.addEventListener("click", () => this._handleClick(), { once: true });
  }

  private _handleClick(): void {
    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    if (canvas) {
      canvas.focus();
    }
  }

  // ── API pública ───────────────────────────────────────────────

  setProgress(percent: number): void {
    const clamped = Math.min(100, Math.max(0, percent));
    this.progressBar.style.width  = `${clamped}%`;
    this.percentLabel.textContent = `${Math.floor(clamped)}%`;
  }

  // Fade out progreso → fade in controles
  showSplash(): void {
    this.progressWrap.style.opacity = "0";
    this.progressWrap.addEventListener("transitionend", () => {
      this.progressWrap.style.display = "none";
      this.splashWrap.style.opacity   = "1";
    }, { once: true });
  }

  hide(): void {
    this.container.style.opacity = "0";
    this.container.style.transition = "opacity 0.5s ease";
    this.container.addEventListener("transitionend", () => {
      this.container.remove();
    }, { once: true });
  }
}