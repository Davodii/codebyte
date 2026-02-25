import { writable } from "svelte/store";

export type PopupOptions = {
    id?: string;
    text: string;
    target: HTMLElement | null;
    centered?: boolean;
};

type PopupInstance = PopupOptions & {
    id: string;
};

function createPopupStore() {
    const { subscribe, update } = writable<PopupInstance[]>([]);

    function showPopup(options: PopupOptions) {
        console.log("Showing popup with options:", options);
        const id = crypto.randomUUID();
        update(popups => [
            ...popups, 
            {...options, id}
        ]);

        return id;
    }

    function close(id: string) {
        update(popups => popups.filter(p => p.id !== id));
    }

    return {
        subscribe,
        showPopup,
        close,
    };
}

export const popupManager = createPopupStore();