// Non-blocking notifications (replaces alert)
(function () {
    window.notify = function (message) {
        if (typeof showToast === 'function') {
            showToast(message);
            return;
        }
        try {
            var el = document.createElement('div');
            el.className = 'toast-msg';
            el.textContent = String(message || '');
            document.body.appendChild(el);
            setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2400);
        } catch (e) {
            if (typeof console !== 'undefined') console.log(message);
        }
    };
})();
