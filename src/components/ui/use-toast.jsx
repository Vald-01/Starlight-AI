// Inspired by react-hot-toast library
import { useState, useEffect } from "react";

const TOAST_LIMIT = 3;
const TOAST_DURATION = 4000;
const TOAST_EXIT_MS = 220;

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

const autoDismissTimers = new Map();
const removalTimers = new Map();

const clearAutoDismiss = (toastId) => {
  const timer = autoDismissTimers.get(toastId);
  if (timer) {
    clearTimeout(timer);
    autoDismissTimers.delete(toastId);
  }
};

const scheduleAutoDismiss = (toastId, duration) => {
  clearAutoDismiss(toastId);
  autoDismissTimers.set(
    toastId,
    setTimeout(() => {
      autoDismissTimers.delete(toastId);
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId });
    }, duration)
  );
};

const addToRemoveQueue = (toastId) => {
  if (removalTimers.has(toastId)) return;
  removalTimers.set(
    toastId,
    setTimeout(() => {
      removalTimers.delete(toastId);
      dispatch({ type: actionTypes.REMOVE_TOAST, toastId });
    }, TOAST_EXIT_MS)
  );
};

// timers of toasts pushed out by the limit must not keep running
const pruneTimers = () => {
  const live = new Set(memoryState.toasts.map((toast) => toast.id));
  for (const id of autoDismissTimers.keys()) if (!live.has(id)) clearAutoDismiss(id);
};

export const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        clearAutoDismiss(toastId);
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          clearAutoDismiss(toast.id);
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners = [];

let memoryState = { toasts: [] };

function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function toast({ duration = TOAST_DURATION, ...props }) {
  const id = genId();

  const update = (props) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    });

  const dismiss = () =>
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      duration,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  pruneTimers();
  scheduleAutoDismiss(id, duration);

  return {
    id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = useState(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
}

export { useToast, toast };
