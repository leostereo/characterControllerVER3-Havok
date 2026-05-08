import { LoadingScreen } from "@/screens/LoadingScreen";

type CurrentScreen = "loading" | "splash" | "game_over" | "none";

export class ScreenManager {
  private static _instance: ScreenManager;

  private loadingScreen = new LoadingScreen();
  private _current: CurrentScreen = "none";

  private constructor() {}

  static getInstance(): ScreenManager {
    if (!ScreenManager._instance) {
      ScreenManager._instance = new ScreenManager();
    }
    return ScreenManager._instance;
  }

  // ── API pública ───────────────────────────────────────────────

  displayLoadingScreen(): void {
    this._current = "loading";
    // La LoadingScreen se monta en el DOM desde su constructor,
    // este método existe para el estado explícito y futuros usos
  }

  setProgress(percent: number): void {
    this.loadingScreen.setProgress(percent);
  }

  // Transiciona de progreso a controles + press any key
  showSplash(): void {
    this._current = "splash";
    this.loadingScreen.showSplash();
  }

  hideLoadingScreen(): void {
    this._current = "none";
    this.loadingScreen.hide();
  }
}