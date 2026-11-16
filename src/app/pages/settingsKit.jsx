import { useCallback, useMemo, useState } from "react";
import { Spinner } from "../../shared/Spinner.jsx";
import { useStore } from "../store.jsx";

/** A settings form saved to the browser: tracks changes, saves, discards. */
export function useSavedSettings(key, defaults) {
  const read = () => {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(key) || "{}") };
    } catch {
      return { ...defaults };
    }
  };
  const { notify } = useStore();
  const [saved, setSaved] = useState(read);
  const [values, setValues] = useState(saved);
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(saved), [values, saved]);
  const set = useCallback((k, v) => setValues((s) => ({ ...s, [k]: v })), []);
  const discard = () => setValues(saved);
  const save = (validate) => {
    if (validate && !validate(values)) return;
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(values));
      setSaved(values);
      setSaving(false);
      notify("As alterações foram salvas!");
    }, 500);
  };
  /** Save immediately without the save bar (used by switches the original applies at once). */
  const saveNow = (next) => {
    localStorage.setItem(key, JSON.stringify(next));
    setSaved(next);
    setValues(next);
  };
  return { values, set, setValues, dirty, save, discard, saving, saveNow, markSaved: setSaved };
}

export function SaveBar({ s, validate }) {
  return (
    <div className={s.dirty ? "save-bar is-visible" : "save-bar"} aria-hidden={!s.dirty}>
      <button type="button" className="kbtn kbtn--outline" onClick={s.discard}>
        Descartar
      </button>
      <button type="button" className="kbtn kbtn--primary" onClick={() => s.save(validate)}>
        {s.saving ? (
          <>
            <Spinner light /> Salvando...
          </>
        ) : (
          "Salvar alterações"
        )}
      </button>
    </div>
  );
}
