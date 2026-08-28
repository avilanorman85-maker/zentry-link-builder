import { useEffect, useImperativeHandle, useRef, useState, forwardRef, useMemo } from "react";

export type HtmlSelection = {
  id: string;
  tag: string;
  text: string;
  href: string;
  className: string;
};

export type HtmlIframeHandle = {
  updateSelected: (patch: { text?: string; href?: string }) => void;
};

type Props = {
  html: string;
  className?: string;
  /** Si true, ocupa 100% del contenedor o viewport */
  fill?: boolean;
  /** Si true, permite seleccionar elementos para editar texto/enlace */
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (sel: HtmlSelection | null) => void;
  onHtmlChange?: (html: string) => void;
};

// Polyfill seguro de Storage (evita errores SecurityError en iframes)
const STORAGE_POLYFILL = `
<script data-zl-injected="storage-polyfill">
(function(){
  try {
    var k = '__zl_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
  } catch(e) {
    var mem = {};
    var p = {
      getItem: function(k){ return mem.hasOwnProperty(k) ? mem[k] : null; },
      setItem: function(k, v){ mem[k] = String(v); },
      removeItem: function(k){ delete mem[k]; },
      clear: function(){ mem = {}; },
      get length(){ return Object.keys(mem).length; },
      key: function(i){ return Object.keys(mem)[i] || null; }
    };
    try { Object.defineProperty(window, 'localStorage', { value: p, configurable: true, writable: true }); } catch(err){}
    try { Object.defineProperty(window, 'sessionStorage', { value: p, configurable: true, writable: true }); } catch(err){}
  }
})();
</script>
`;

// Script de EDICIÓN: captura clics para seleccionarlos en el editor lateral sin romper scripts ni diseño
const EDIT_SCRIPT = `
<script data-zl-injected="editor">
(function(){
  var SEL_ATTR = 'data-zl-id';
  var counter = 0;

  function tagAll(){
    document.querySelectorAll('a, button, [role="button"], input[type="submit"], input[type="button"]').forEach(function(el){
      if(!el.getAttribute(SEL_ATTR)) el.setAttribute(SEL_ATTR, 'zl-' + (++counter));
    });
  }

  function highlight(id){
    document.querySelectorAll('[' + SEL_ATTR + ']').forEach(function(el){
      el.style.outline = ''; el.style.outlineOffset = '';
    });
    if(!id) return;
    var el = document.querySelector('[' + SEL_ATTR + '="' + id + '"]');
    if(el){
      el.style.outline = '2px solid #A78BFA';
      el.style.outlineOffset = '2px';
    }
  }

  // Notificar selección al hacer clic
  document.addEventListener('click', function(e){
    var el = e.target && e.target.closest ? e.target.closest('a, button, [role="button"], input[type="submit"]') : null;
    if(!el) return;

    tagAll();
    var id = el.getAttribute(SEL_ATTR);
    highlight(id);

    var href = el.getAttribute('href') || el.getAttribute('data-zl-href') || '';
    var text = (el.textContent || el.value || '').trim();

    try{
      parent.postMessage({
        source: 'zl-iframe',
        type: 'select',
        id: id,
        tag: el.tagName.toLowerCase(),
        text: text,
        href: href,
        className: el.className || ''
      }, '*');
    } catch(err){}

    // Navegación por anclas internas (#secreto, #receta, etc.)
    if(href && href.startsWith('#') && href.length > 1){
      var targetId = href.substring(1);
      var targetEl = document.getElementById(targetId) || document.querySelector('[name="' + targetId + '"]');
      if(targetEl){
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    // Si es un link externo <a> evitar que navegue fuera del constructor
    if(el.tagName === 'A' && href && !href.startsWith('#') && !href.startsWith('javascript:')){
      e.preventDefault();
    }
  }, false);

  window.addEventListener('message', function(ev){
    var d = ev.data || {};
    if(d.source !== 'zl-parent') return;

    if(d.type === 'update'){
      var el = document.querySelector('[' + SEL_ATTR + '="' + d.id + '"]');
      if(!el) return;
      if(typeof d.text === 'string'){
        if(el.tagName === 'INPUT') el.value = d.text;
        else el.textContent = d.text;
      }
      if(typeof d.href === 'string'){
        if(el.tagName === 'A') el.setAttribute('href', d.href);
        else el.setAttribute('data-zl-href', d.href);
      }
    } else if(d.type === 'highlight'){
      highlight(d.id || null);
    }
  });

  function init(){ tagAll(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
</script>
`;

// Script PÚBLICO: rastrea clics para analíticas y permite navegación fluida
const PUBLIC_SCRIPT = `
<script data-zl-injected="public">
(function(){
  function trackClick(label, href){
    try {
      if(window.parent && window.parent !== window) {
        window.parent.postMessage({ source: 'zl-public-click', label: label, href: href }, '*');
      }
    } catch(e){}
  }

  document.addEventListener('click', function(e){
    var el = e.target && e.target.closest ? e.target.closest('a, button, [role="button"], input[type="submit"]') : null;
    if(!el) return;

    var href = el.getAttribute('href') || el.getAttribute('data-zl-href') || '';
    var label = (el.textContent || el.value || '').trim() || el.getAttribute('aria-label') || href || 'Botón';

    trackClick(label, href);

    // Navegación fluida por anclas internas (#secreto, #receta)
    if(href && href.startsWith('#') && href.length > 1){
      var targetId = href.substring(1);
      var targetEl = document.getElementById(targetId) || document.querySelector('[name="' + targetId + '"]');
      if(targetEl){
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    if(el.tagName === 'A' && href && !href.startsWith('#') && !href.startsWith('javascript:')){
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }
  }, false);
})();
</script>
`;

export const HtmlIframe = forwardRef<HtmlIframeHandle, Props>(function HtmlIframe(
  { html, className = "", fill, editable, selectedId, onSelect, onHtmlChange },
  ref,
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [autoHeight, setAutoHeight] = useState(600);

  const isFullDoc = /<html[\s>]|<!doctype/i.test(html);
  const injectScript = STORAGE_POLYFILL + (editable ? EDIT_SCRIPT : PUBLIC_SCRIPT);
  const viewportMeta = `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">`;

  const srcDoc = useMemo(() => {
    if (!html) return `<!doctype html><html><body></body></html>`;
    if (isFullDoc) {
      let doc = html;
      if (!/<meta[^>]*name=["']viewport["']/i.test(doc)) {
        doc = /<head[^>]*>/i.test(doc)
          ? doc.replace(/<head[^>]*>/i, (m) => `${m}${viewportMeta}`)
          : doc.replace(/<html[^>]*>/i, (m) => `${m}<head>${viewportMeta}</head>`);
      }
      doc = /<\/body>/i.test(doc) ? doc.replace(/<\/body>/i, `${injectScript}</body>`) : doc + injectScript;
      return doc;
    } else {
      return `<!doctype html><html><head><meta charset="utf-8">${viewportMeta}<style>body{margin:0;font-family:system-ui,sans-serif}</style></head><body>${html}${injectScript}</body></html>`;
    }
  }, [html, editable, isFullDoc]);

  useEffect(() => {
    if (fill) return;
    const resize = () => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      const h = Math.max(doc.documentElement?.scrollHeight ?? 0, doc.body?.scrollHeight ?? 0);
      if (h > 0 && Math.abs(h - autoHeight) > 10) setAutoHeight(h);
    };
    const id = window.setInterval(resize, 800);
    return () => window.clearInterval(id);
  }, [fill, autoHeight]);

  useEffect(() => {
    if (!editable) return;
    const handler = (ev: MessageEvent) => {
      const d: any = ev.data;
      if (!d || d.source !== "zl-iframe") return;
      if (d.type === "select") onSelect?.({ id: d.id, tag: d.tag, text: d.text, href: d.href, className: d.className });
      if (d.type === "html") onHtmlChange?.(d.html);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [editable, onSelect, onHtmlChange]);

  useEffect(() => {
    if (!editable) return;
    iframeRef.current?.contentWindow?.postMessage(
      { source: "zl-parent", type: "highlight", id: selectedId ?? null },
      "*",
    );
  }, [selectedId, editable]);

  useImperativeHandle(ref, () => ({
    updateSelected: (patch) => {
      if (!selectedId) return;
      iframeRef.current?.contentWindow?.postMessage(
        { source: "zl-parent", type: "update", id: selectedId, ...patch },
        "*",
      );
    },
  }), [selectedId]);

  const sandbox = "allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads allow-pointer-lock";

  return (
    <iframe
      ref={iframeRef}
      title="contenido-web"
      srcDoc={srcDoc}
      sandbox={sandbox}
      style={fill
        ? { width: "100%", height: "100%", minHeight: "100%", border: 0, display: "block", background: "transparent", margin: 0, padding: 0 }
        : { width: "100%", height: autoHeight, border: 0, display: "block", background: "transparent" }}
      className={className}
    />
  );
});
