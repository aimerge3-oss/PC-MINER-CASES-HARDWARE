// Quiet notify — no alert spam
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
            setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2000);
        } catch (e) {}
    };
})();
