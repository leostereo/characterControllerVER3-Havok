export class SplashScreen {
  private container: HTMLDivElement;
  private onContinueCallback: (() => void) | null = null;
  private _boundHandler!: (e: KeyboardEvent) => void;

  constructor() {
    this.container = document.createElement("div");
    this._build();
  }

  private _build(): void {
    Object.assign(this.container.style, {
      position:       "fixed",
      inset:          "0",
      background:     "linear-gradient(160deg, #0a0a0f 60%, #12102a 100%)",
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      gap:            "40px",
      fontFamily:     "monospace",
      color:          "#e0e0e0",
      zIndex:         "99",
      opacity:        "0",
      transition:     "opacity 0.5s ease",
    });

    // ── Título ──────────────────────────────────────────────────
    const title = document.createElement("h1");
    title.textContent = "MY GAME";
    Object.assign(title.style, {
      fontSize:      "4rem",
      letterSpacing: "0.5em",
      color:         "#ffffff",
      margin:        "0",
      textTransform: "uppercase",
    });

    const subtitle = document.createElement("p");
    subtitle.textContent = "Una aventura de acción";
    Object.assign(subtitle.style, {
      fontSize:      "0.9rem",
      color:         "#666",
      margin:        "0",
      letterSpacing: "0.2em",
    });

    // ── Controles ───────────────────────────────────────────────
    const controlsTitle = document.createElement("h3");
    controlsTitle.textContent = "CONTROLES";
    Object.assign(controlsTitle.style, {
      fontSize:      "0.7rem",
      letterSpacing: "0.3em",
      color:         "#444",
      margin:        "0",
    });

    const grid = document.createElement("div");
    Object.assign(grid.style, {
      display:             "grid",
      gridTemplateColumns: "auto auto",
      gap:                 "10px 32px",
      fontSize:            "0.82rem",
    });

    const controls = [
      { key: "W A S D", action: "Moverse"        },
      { key: "SPACE",   action: "Saltar"          },
      { key: "SHIFT",   action: "Correr"          },
      { key: "ESC",     action: "Pausar"          },
      { key: "MOUSE",   action: "Apuntar / girar" },
      { key: "LMB",     action: "Atacar"          },
    ];

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

    // ── Press any key ───────────────────────────────────────────
    const prompt = document.createElement("p");
    prompt.textContent = "PRESS ANY KEY TO CONTINUE";
    Object.assign(prompt.style, {
      fontSize:      "0.75rem",
      letterSpacing: "0.3em",
      color:         "#6c63ff",
      margin:        "0",
      animation:     "blink 1.4s ease-in-out infinite",
    });

    if (!document.getElementById("splash-styles")) {
      const style = document.createElement("style");
      style.id = "splash-styles";
      style.textContent = `
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
      `;
      document.head.appendChild(style);
    }

    this.container.append(title, subtitle, controlsTitle, grid, prompt);
    document.body.appendChild(this.container);
  }

  // ── API pública ───────────────────────────────────────────────

  show(): void {
    // Delay para ignorar keypresses residuales durante la carga
    setTimeout(() => {
      requestAnimationFrame(() => {
        this.container.style.opacity = "1";
      });

      this._boundHandler = (e: KeyboardEvent): void => {
        if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
        this._continue();
      };

      window.addEventListener("keydown", this._boundHandler);
    }, 300);
  }

  onContinue(callback: () => void): void {
    this.onContinueCallback = callback;
  }

  hide(): void {
    this.container.style.opacity = "0";
    this.container.addEventListener("transitionend", () => {
      this.container.remove();
    }, { once: true });
  }

  // ── Privados ──────────────────────────────────────────────────

  private _continue(): void {
    window.removeEventListener("keydown", this._boundHandler);
    this.hide();
    this.onContinueCallback?.();
  }
}