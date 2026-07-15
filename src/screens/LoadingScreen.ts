import { controlsConfig } from "@/config/GameConfig";

export class LoadingScreen {
  private container: HTMLDivElement;
  private progressWrap: HTMLDivElement;
  private progressBar: HTMLDivElement;
  private percentLabel: HTMLSpanElement;
  private splashWrap: HTMLDivElement;

  constructor() {
    this.container = document.createElement("div");
    this.progressWrap = document.createElement("div");
    this.progressBar = document.createElement("div");
    this.percentLabel = document.createElement("span");
    this.splashWrap = document.createElement("div");
    this._build();
  }

  private _build(): void {
    // ── Contenedor principal ────────────────────────────────────
    Object.assign(this.container.style, {
      position: "fixed",
      inset: "0",
      background: "linear-gradient(160deg, #0a0a0f 60%, #12102a 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "32px",
      fontFamily: "monospace",
      color: "#e0e0e0",
      zIndex: "100",
    });

    // ── Título (siempre visible) ─────────────────────────────────
    const title = document.createElement("h1");
    title.textContent = "Space Freesbe";
    Object.assign(title.style, {
      fontSize: "3.5rem",
      letterSpacing: "0.5em",
      color: "#ffffff",
      margin: "0",
      textTransform: "uppercase",
    });

    // ── Sección de progreso ─────────────────────────────────────
    Object.assign(this.progressWrap.style, {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "12px",
      opacity: "1",
      transition: "opacity 0.4s ease",
    });

    const track = document.createElement("div");
    Object.assign(track.style, {
      width: "340px",
      height: "4px",
      background: "#1e1e2e",
      borderRadius: "2px",
      overflow: "hidden",
    });

    Object.assign(this.progressBar.style, {
      width: "0%",
      height: "100%",
      background: "#6c63ff",
      borderRadius: "2px",
      transition: "width 0.2s ease",
    });

    Object.assign(this.percentLabel.style, {
      fontSize: "0.85rem",
      color: "#888",
    });
    this.percentLabel.textContent = "0%";

    track.appendChild(this.progressBar);
    this.progressWrap.append(track, this.percentLabel);

    // ── Sección splash (controles + press any key) ──────────────
    Object.assign(this.splashWrap.style, {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "24px",
      opacity: "0",
      transition: "opacity 0.4s ease",
      pointerEvents: "none",
    });

    const grid = document.createElement("div");
    Object.assign(grid.style, {
      display: "grid",
      gridTemplateColumns: "auto auto",
      gap: "10px 32px",
      fontSize: "0.82rem",
      minWidth: "320px",
      alignContent: "center",
    });

    const controls = controlsConfig.keys;

    controls.forEach(({ key, action }) => {
      const keyEl = document.createElement("span");
      keyEl.textContent = key;
      Object.assign(keyEl.style, {
        background: "#1a1a2e",
        border: "1px solid #2a2a4a",
        borderRadius: "4px",
        padding: "3px 10px",
        color: "#aaa",
        textAlign: "center",
        fontSize: "0.78rem",
      });

      const actionEl = document.createElement("span");
      actionEl.textContent = action;
      actionEl.style.color = "#666";

      grid.append(keyEl, actionEl);
    });

    const prompt = document.createElement("p");
    prompt.textContent = "PRESS ANY KEY OR BUTTON TO CONTINUE (or doble TAB)";
    Object.assign(prompt.style, {
      fontSize: "0.75rem",
      letterSpacing: "0.3em",
      color: "#6c63ff",
      margin: "0",
      animation: "blink 1.4s ease-in-out infinite",
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

    // ── Contenedor de splash dividido (izquierda: teclado, derecha: gamepad SVG)
    const splashColumns = document.createElement("div");
    Object.assign(splashColumns.style, {
      display: "flex",
      flexDirection: "row",
      gap: "72px", // más separación entre columnas
      alignItems: "center",
    });

    // Divisor visual sutil entre columnas
    const divider = document.createElement("div");
    Object.assign(divider.style, {
      width: "1px",
      alignSelf: "stretch",
      background: "linear-gradient(180deg, transparent, #2a2a4a, transparent)",
    });

    // Right: SVG controller
    const svgWrap = document.createElement("div");
    Object.assign(svgWrap.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "400px",
      height: "260px",
    });

    Object.assign(svgWrap.style, {
      width: "520px",
      height: "260px",
    });

    svgWrap.appendChild(this._buildGamepadSvg());

    splashColumns.append(grid, divider, svgWrap);

    this.splashWrap.append(splashColumns, prompt);
    this.container.append(title, this.progressWrap, this.splashWrap);
    document.body.appendChild(this.container);

    // ── Event listener para click (una sola vez) ─────────────────
    this.container.addEventListener("click", () => this._handleClick(), { once: true });
  }

  // ── Construcción del SVG del gamepad ────────────────────────────
  private _buildGamepadSvg(): SVGSVGElement {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 520 260");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");

    const colors = {
      body: "#14131f",
      bodyStroke: "#2f2f4d",
      panel: "#1a1a2e",
      panelStroke: "#33335a",
      accent: "#6c63ff",
      text: "#cfcfdc",
      textDim: "#8888a0",
    };

    // Línea guía + etiqueta (uno o dos tramos rectos) para no escribir la
    // función encima del control.
    const addLeader = (points: [number, number][]): void => {
      const line = document.createElementNS(svgNS, "polyline");
      line.setAttribute("points", points.map(([x, y]) => `${x},${y}`).join(" "));
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", colors.panelStroke);
      line.setAttribute("stroke-width", "1.5");
      svg.appendChild(line);
    };

    const addLabel = (
      x: number,
      y: number,
      anchor: "start" | "middle" | "end",
      text: string,
      color = colors.textDim,
      size = 10,
    ): void => {
      const t = document.createElementNS(svgNS, "text");
      t.setAttribute("x", String(x));
      t.setAttribute("y", String(y));
      t.setAttribute("text-anchor", anchor);
      t.setAttribute("font-size", String(size));
      t.setAttribute("fill", color);
      t.textContent = text;
      svg.appendChild(t);
    };

    // ── Cuerpo del control (forma tipo "mariposa" con dos lóbulos) ──
    const bodyPath = document.createElementNS(svgNS, "path");
    bodyPath.setAttribute(
      "d",
      `M 110 65
       H 350
       C 393 65 421 90 426 128
       C 431 168 407 205 370 205
       C 344 205 327 188 305 168
       C 292 158 277 152 230 152
       C 183 152 168 158 155 168
       C 133 188 116 205 90 205
       C 53 205 29 168 34 128
       C 39 90 67 65 110 65 Z`
    );
    bodyPath.setAttribute("fill", colors.body);
    bodyPath.setAttribute("stroke", colors.bodyStroke);
    bodyPath.setAttribute("stroke-width", "2");
    svg.appendChild(bodyPath);

    // ── Gatillos (LT / RT) ──
    const lt = document.createElementNS(svgNS, "rect");
    lt.setAttribute("x", "55");
    lt.setAttribute("y", "40");
    lt.setAttribute("width", "80");
    lt.setAttribute("height", "14");
    lt.setAttribute("rx", "6");
    lt.setAttribute("fill", colors.panel);
    lt.setAttribute("stroke", colors.panelStroke);
    svg.appendChild(lt);

    const rt = document.createElementNS(svgNS, "rect");
    rt.setAttribute("x", "325");
    rt.setAttribute("y", "40");
    rt.setAttribute("width", "80");
    rt.setAttribute("height", "14");
    rt.setAttribute("rx", "6");
    rt.setAttribute("fill", colors.accent);
    rt.setAttribute("fill-opacity", "0.25");
    rt.setAttribute("stroke", colors.accent);
    svg.appendChild(rt);

    addLabel(365, 34, "middle", "Run (R2)", colors.accent, 9);

    // ── Stick izquierdo (movimiento), cerca del borde ──
    const stickCx = 95;
    const stickCy = 135;

    const stickOuter = document.createElementNS(svgNS, "circle");
    stickOuter.setAttribute("cx", String(stickCx));
    stickOuter.setAttribute("cy", String(stickCy));
    stickOuter.setAttribute("r", "30");
    stickOuter.setAttribute("fill", colors.panel);
    stickOuter.setAttribute("stroke", colors.panelStroke);
    stickOuter.setAttribute("stroke-width", "2");
    svg.appendChild(stickOuter);

    const stickInner = document.createElementNS(svgNS, "circle");
    stickInner.setAttribute("cx", String(stickCx));
    stickInner.setAttribute("cy", String(stickCy));
    stickInner.setAttribute("r", "16");
    stickInner.setAttribute("fill", "#0d0d16");
    stickInner.setAttribute("stroke", colors.accent);
    stickInner.setAttribute("stroke-width", "2");
    svg.appendChild(stickInner);

    // flechitas indicando ejes del stick
    const arrow = (dx: number, dy: number, rot: number): void => {
      const a = document.createElementNS(svgNS, "path");
      a.setAttribute("d", "M 0 -5 L 4 3 L -4 3 Z");
      a.setAttribute("fill", colors.textDim);
      a.setAttribute(
        "transform",
        `translate(${stickCx + dx}, ${stickCy + dy}) rotate(${rot})`
      );
      svg.appendChild(a);
    };
    arrow(0, -38, 0);    // arriba
    arrow(0, 38, 180);   // abajo
    arrow(-38, 0, -90);  // izquierda
    arrow(38, 0, 90);    // derecha

    addLeader([[stickCx, stickCy + 44], [stickCx, stickCy + 92]]);
    addLabel(stickCx, stickCy + 104, "middle", "Mover / Girar");

    // ── Start: ícono triangular tipo "play", entre el stick y el botón 0 ──
    const startCx = 250;
    const startCy = 135;

    const start = document.createElementNS(svgNS, "path");
    start.setAttribute(
      "d",
      `M ${startCx - 7} ${startCy - 9} L ${startCx + 8} ${startCy} L ${startCx - 7} ${startCy + 9} Z`
    );
    start.setAttribute("fill", colors.accent);
    start.setAttribute("fill-opacity", "0.3");
    start.setAttribute("stroke", colors.accent);
    start.setAttribute("stroke-width", "1.5");
    start.setAttribute("stroke-linejoin", "round");
    svg.appendChild(start);

    addLeader([[startCx, startCy + 11], [startCx, startCy + 68]]);
    addLabel(startCx, startCy + 80, "middle", "Start", colors.accent, 9);

    // ── Botones de acción (derecha, en rombo) ──
    const faceCx = 365;
    const faceCy = 135;
    const faceR = 34;
    const btnR = 12;
    // Columna común donde alinean sus etiquetas Jump, Throw y Roll/Duck
    const FACE_LABEL_LINE_X = 450;
    const FACE_LABEL_X = 454;

    const buttonDefs: { dx: number; dy: number; label: string }[] = [
      { dx: 0, dy: -faceR, label: "Jump" },
      { dx: 0, dy: faceR, label: "Throw" },
      { dx: faceR, dy: 0, label: "Roll/Duck" },
      { dx: -faceR, dy: 0, label: "SuperVision" },
    ];

    buttonDefs.forEach((b) => {
      const cx = faceCx + b.dx;
      const cy = faceCy + b.dy;

      const c = document.createElementNS(svgNS, "circle");
      c.setAttribute("cx", String(cx));
      c.setAttribute("cy", String(cy));
      c.setAttribute("r", String(btnR));
      c.setAttribute("fill", colors.panel);
      c.setAttribute("stroke", colors.accent);
      c.setAttribute("stroke-width", "1.5");
      svg.appendChild(c);

      if (b.dx < 0) {
        // izquierda (SuperVision) → baja y luego dobla a la derecha,
        // quedando debajo de la etiqueta de Throw, en la misma columna
        addLeader([
          [cx, cy + btnR],
          [cx, cy + btnR + 46],
          [FACE_LABEL_LINE_X, cy + btnR + 46],
        ]);
        addLabel(FACE_LABEL_X, cy + btnR + 49, "start", b.label, colors.textDim, 9);
      } else {
        // Jump, Throw y Roll/Duck → línea horizontal recta hasta una misma
        // columna, para que las tres etiquetas queden alineadas entre sí
        const edgeX = cx + btnR;
        addLeader([[edgeX, cy], [FACE_LABEL_LINE_X, cy]]);
        addLabel(FACE_LABEL_X, cy + 3, "start", b.label, colors.textDim, 9);
      }
    });

    return svg;
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
    this.progressBar.style.width = `${clamped}%`;
    this.percentLabel.textContent = `${Math.floor(clamped)}%`;
  }

  // Fade out progreso → fade in controles
  showSplash(): void {
    this.progressWrap.style.opacity = "0";
    this.progressWrap.addEventListener("transitionend", () => {
      this.progressWrap.style.display = "none";
      this.splashWrap.style.opacity = "1";
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