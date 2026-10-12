import { useState } from "react";

// The food listing is filled in over three pages (details, location & time, photos),
// so the in-progress draft is kept in sessionStorage until it is submitted.
const DRAFT_KEY = "food_listing_draft";

export const FOOD_TAGS = ["Fresh / Hot", "Canned"];
export const ALLERGENS = ["Milk", "Eggs", "Fish", "Shellfish", "Peanuts", "Tree Nuts", "Soy", "Wheat", "Sesame"];
export const MAX_PHOTOS = 3;

const emptyDraft = {
    foodItem: "",
    description: "",
    tags: [],
    allergens: [],
    address: "",
    date: "",
    startTime: "",
    endTime: "",
    photos: [],
};

function loadDraft() {
    try {
        const saved = sessionStorage.getItem(DRAFT_KEY);
        return saved ? { ...emptyDraft, ...JSON.parse(saved) } : emptyDraft;
    } catch {
        return emptyDraft;
    }
}

function saveDraft(draft) {
    try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
        // Storage full or blocked; the draft still lives in component state
    }
}

export function clearFoodDraft() {
    try {
        sessionStorage.removeItem(DRAFT_KEY);
    } catch {
        // Nothing to clear
    }
}

// Returns [draft, updateDraft]; updateDraft merges fields and persists them
export function useFoodDraft() {
    const [draft, setDraft] = useState(loadDraft);

    const updateDraft = (changes) => {
        setDraft((prev) => {
            const next = { ...prev, ...changes };
            saveDraft(next);
            return next;
        });
    };

    return [draft, updateDraft];
}

// Adds or removes a value from a list (used by the tag and allergen buttons)
export function toggleValue(list, value) {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// Validation per step, so a page can't be skipped by typing its URL
export function detailsError(draft) {
    if (!draft.foodItem.trim() || !draft.description.trim()) {
        return "Please enter a listing title and description.";
    }
    if (draft.tags.length === 0) {
        return "Please select a tag for your food item.";
    }
    return "";
}

export function todayString() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function locationError(draft) {
    if (!draft.address.trim() || !draft.date || !draft.startTime || !draft.endTime) {
        return "Please enter an address, date, and pickup window.";
    }
    if (draft.date < todayString()) {
        return "Pickup date cannot be in the past.";
    }
    if (draft.endTime <= draft.startTime) {
        return "Pickup end time must be after the start time.";
    }
    return "";
}

// Shrinks a photo to fit within maxSize px and returns it as a JPEG data URL
export function resizePhoto(file, maxSize = 1024) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Could not read image"));
        };
        img.src = url;
    });
}
