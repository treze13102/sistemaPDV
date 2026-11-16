import { useEffect, useState } from "react";

// Path-based navigation without a full reload. Every route also has its own static page,
// so a refresh or a shared link opens the same screen.
const listeners = new Set();
let historyPosition = Number(window.history.state?.pdvPosition ?? 0);
let restoringPosition = false;
let confirmedPop = false;
window.history.replaceState({ ...window.history.state, pdvPosition: historyPosition }, "");

export function navigate(to, confirmed = false) {
  if (to === window.location.pathname + window.location.search) return;
  if (!confirmed) {
    const event = new CustomEvent("pdv:before-navigate", {cancelable:true,detail:{go:()=>navigate(to,true)}});
    if (!window.dispatchEvent(event)) return;
  }
  window.history.pushState({pdvPosition: ++historyPosition}, "", to);
  listeners.forEach((l) => l());
  window.scrollTo(0, 0);
}

export function useRoute() {
  const read = () => {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const params = Object.fromEntries(new URLSearchParams(window.location.search));
    return { path, parts: path.split("/").filter(Boolean), params };
  };
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const update = () => setRoute(read());
    const pop = event => {
      if (restoringPosition) { restoringPosition = false; return; }
      const destination = event.state?.pdvPosition;
      if (!confirmedPop && Number.isFinite(destination) && destination !== historyPosition) {
        const direction = destination - historyPosition;
        const guard = new CustomEvent("pdv:before-navigate", {cancelable:true,detail:{go:()=>{confirmedPop=true;window.history.go(direction);}}});
        if (!window.dispatchEvent(guard)) {
          restoringPosition = true;
          window.history.go(-direction);
          return;
        }
      }
      confirmedPop = false;
      historyPosition = Number.isFinite(destination) ? destination : historyPosition;
      update();
    };
    listeners.add(update);
    window.addEventListener("popstate", pop);
    return () => {
      listeners.delete(update);
      window.removeEventListener("popstate", pop);
    };
  }, []);
  return route;
}

/** <a> that navigates in-app; still a real link (opens in new tab, works without JS). */
export function Link({ to, children, className, onClick, ...rest }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
