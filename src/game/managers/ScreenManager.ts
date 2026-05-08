import { LoadingScreen } from "@/screens/LoadingScreen";
import { SplashScreen } from "@/screens/SplashScreen";

type CurrentScreen = "loading" | "splash" | "none";

export class ScreenManager {
    private static _instance: ScreenManager;

    private loadingScreen = new LoadingScreen();
    private splashScreen = new SplashScreen();
    private _current: CurrentScreen = "loading";

    private constructor() { }

    static getInstance(): ScreenManager {
        if (!ScreenManager._instance) {
            ScreenManager._instance = new ScreenManager();
        }
        return ScreenManager._instance;
    }

    // ── API pública ───────────────────────────────────────────────

    setProgress(percent: number): void {
        this.loadingScreen.setProgress(percent);
    }

    // Fade out loading → fade in splash → resuelve cuando el usuario presiona tecla
    async transitionToSplash(): Promise<void> {
        this.loadingScreen.hide();
        this._current = "splash";
        await this._waitForSplash();
    }

    // Fade out splash (por si se necesita ocultar programáticamente)
    async transitionToNone(): Promise<void> {
        if (this._current === "splash") {
            this.splashScreen.hide();
        }
        this._current = "none";
    }

    // ── Privados ──────────────────────────────────────────────────

    // Muestra el splash y retorna Promise que resuelve cuando el usuario presiona tecla
    private _waitForSplash(): Promise<void> {
        return new Promise((resolve) => {
            this.splashScreen.onContinue(() => resolve()); // resuelve después del fade
            this.splashScreen.show();
        });
    }
}