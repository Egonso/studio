
'use client';

// This service uses localStorage for data persistence.
// It's a simple client-side solution for this prototype.

const getLocalStorageItem = <T,>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
};

const setLocalStorageItem = <T,>(key: string, value: T) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
};

// --- Specific data functions ---

export function saveAssessmentAnswers(answers: Record<string, string>) {
    setLocalStorageItem('assessmentAnswers', answers);
    // When a new assessment is saved, clear old checklist and context data
    localStorage.removeItem('checklistState');
    localStorage.removeItem('companyContext');
    localStorage.removeItem('currentTask');
}

export function getAssessmentAnswers() {
    return getLocalStorageItem<Record<string, string>>('assessmentAnswers');
}

export function saveCompanyContext(context: object) {
    setLocalStorageItem('companyContext', context);
}

export function getCompanyContext() {
    return getLocalStorageItem<object>('companyContext');
}

export function saveChecklistState(state: object) {
    setLocalStorageItem('checklistState', state);
}

export function getChecklistState() {
    return getLocalStorageItem<any>('checklistState') || {};
}

export function saveCurrentTask(task: object) {
     setLocalStorageItem('currentTask', task);
}

export function getCurrentTask() {
    return getLocalStorageItem<any>('currentTask');
}

export function clearCurrentTask() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('currentTask');
}
