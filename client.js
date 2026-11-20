/**
 * Client half of dsh-approval-notify.
 *
 * Subscribes to the approval waterfall in the page, posts a native
 * notification through the Electron renderer (so the banner carries the
 * DeepSeek Harness icon and opens the app when clicked), then delegates to
 * the next answerer. It never answers an approval itself.
 */
window.__ModuleLoader__.load({
  id: 'dsh-approval-notify',
  factory(require) {
    const DEFAULTS = {
      title: 'DeepSeek Harness',
      whenFocused: 'skip',
      silent: false,
    }

    function label(request) {
      const tool = request && request.toolName
      return typeof tool === 'string' && tool.length > 0 ? tool : '工具调用'
    }

    function body(request) {
      const reason =
        (request && (request.displayReason || request.reason)) || ''
      const text = String(reason).trim()
      return text ? `${label(request)}：${text}` : `${label(request)} 需要你的确认`
    }

    function apply(ctx, config) {
      const options = Object.assign({}, DEFAULTS, config || {})
      if (typeof Notification === 'undefined') return

      // Ask once, lazily: Electron often reports "granted" already, and a
      // request from a non-user gesture is rejected by some platforms.
      let asked = false
      function ensurePermission() {
        if (Notification.permission !== 'default' || asked) return
        asked = true
        try {
          const pending = Notification.requestPermission()
          if (pending && typeof pending.catch === 'function') pending.catch(() => {})
        } catch {}
      }

      function post(request) {
        if (Notification.permission === 'default') ensurePermission()
        if (Notification.permission !== 'granted') return

        const notification = new Notification(options.title, {
          body: body(request),
          tag: 'dsh-approval',
          silent: Boolean(options.silent),
        })
        notification.onclick = () => {
          try {
            window.focus()
          } catch {}
          try {
            notification.close()
          } catch {}
        }
      }

      ctx.effect(() => {
        const off = ctx.remote.$on('approval/request', function (request, next) {
          try {
            const focused = typeof document !== 'undefined' && document.hasFocus()
            if (!(focused && options.whenFocused === 'skip')) post(request)
          } catch {}
          return next()
        })
        return () => {
          try {
            if (typeof off === 'function') off()
          } catch {}
        }
      }, 'approval-notify: approval listener')
    }

    return { inject: ['remote'], apply }
  },
})
