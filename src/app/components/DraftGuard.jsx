import { useEffect, useState } from 'react';
import { Modal } from '../../config/ui.jsx';

export function useDraftGuard(dirty, busy, onClose) {
  const [asking, setAsking] = useState(false);
  const [pending, setPending] = useState(null);
  useEffect(() => {
    if (!dirty && !busy) return;
    const prevent = event => { event.preventDefault(); event.returnValue = ''; };
    const navigate = event => {event.preventDefault();if(!busy){setPending(()=>event.detail.go);setAsking(true);}};
    window.addEventListener('beforeunload', prevent);
    window.addEventListener('pdv:before-navigate',navigate);
    return () => {window.removeEventListener('beforeunload', prevent);window.removeEventListener('pdv:before-navigate',navigate);};
  }, [dirty, busy]);
  return { close: () => { if (!busy) dirty ? (setPending(null),setAsking(true)) : onClose(); }, dialog: asking && <Modal title="Descartar alterações?" onClose={() => setAsking(false)} actions={<><button className="kbtn kbtn--outline" onClick={() => setAsking(false)}>Continuar editando</button><button className="kbtn kbtn--primary" onClick={()=>{setAsking(false);pending ? pending() : onClose();}}>Descartar alterações</button></>}><p>Os dados ainda não foram salvos. Deseja descartá-los?</p></Modal> };
}
