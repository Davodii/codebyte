import { writable } from "svelte/store";

export interface Settings {
    theme: "light" | "dark";
    fontSize: number;
    showLineNumbers: boolean;
}

const defaultSettings: Settings = {
    theme: "light",
    fontSize: 14,
    showLineNumbers: true,
};

class SettingsStore {
    value = $state<Settings>(defaultSettings);

    constructor() {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("settings");
            if (stored) this.value = JSON.parse(stored);


            // $effect handles DOM-side-effects
            $effect.root(() => {
                $effect(() => {
                    localStorage.setItem("settings", JSON.stringify(this.value));
                    document.documentElement.setAttribute("data-theme", this.value.theme);
                    document.documentElement.style.setProperty("--font-size", `${this.value.fontSize}px`);
                })
            });
        }
    }

    toggleTheme() {
        this.value.theme = this.value.theme === "light" ? "dark" : "light";
    }

    updateFontSize(size: number) {
        if (size < 12 || size > 24) return;
        this.value.fontSize = size;
    }
}

export const settings = new SettingsStore();