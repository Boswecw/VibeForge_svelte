/**
 * Toast Store - Simple toast notification system
 * Manages toast notifications with auto-dismiss
 */

import { browser } from "$app/environment";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number; // ms, 0 = no auto-dismiss
}

interface ToastState {
  toasts: Toast[];
}

const state = $state<ToastState>({
  toasts: [],
});

// ============================================================================
// ACTIONS
// ============================================================================

function addToast(
  message: string,
  type: Toast["type"] = "info",
  duration: number = 3000
): string {
  const id = `toast-${Date.now()}-${Math.random()}`;
  const toast: Toast = { id, message, type, duration };

  state.toasts = [...state.toasts, toast];

  // Auto-dismiss if duration > 0
  if (duration > 0 && browser) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
}

function removeToast(id: string) {
  state.toasts = state.toasts.filter((t) => t.id !== id);
}

function clearAll() {
  state.toasts = [];
}

// ============================================================================
// CONVENIENCE METHODS
// ============================================================================

function success(message: string, duration?: number) {
  return addToast(message, "success", duration);
}

function error(message: string, duration?: number) {
  return addToast(message, "error", duration || 5000);
}

function info(message: string, duration?: number) {
  return addToast(message, "info", duration);
}

function warning(message: string, duration?: number) {
  return addToast(message, "warning", duration || 4000);
}

// ============================================================================
// EXPORTS
// ============================================================================

export const toastStore = {
  get toasts() {
    return state.toasts;
  },
  addToast,
  removeToast,
  clearAll,
  success,
  error,
  info,
  warning,
};
