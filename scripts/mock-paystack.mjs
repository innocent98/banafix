/**
 * Tiny local stand-in for api.paystack.co so the REAL webhook / enrol code can be exercised
 * without live keys. Start the app with PAYSTACK_BASE_URL=http://127.0.0.1:4010 (and any
 * PAYSTACK_SECRET_KEY); sign webhook bodies with that same key (scripts/test-webhook.mjs does).
 *
 *   node scripts/mock-paystack.mjs            # listens on :4010
 *
 *  POST /transaction/initialize      -> {status:true, data:{authorization_url, access_code, reference}}
 *  GET  /transaction/verify/:ref     -> success, unless the reference contains "FAIL" (then failed)
 *
 * This proves OUR handling of Paystack responses. It does NOT prove Paystack itself: a real
 * test-mode charge with John's keys is still required.
 */
import http from 'node:http'

const port = Number(process.env.MOCK_PAYSTACK_PORT || 4010)

const server = http.createServer((req, res) => {
  const send = (code, body) => {
    res.writeHead(code, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(body))
  }
  let raw = ''
  req.on('data', (c) => (raw += c))
  req.on('end', () => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`)
    if (req.method === 'POST' && url.pathname === '/transaction/initialize') {
      const body = raw ? JSON.parse(raw) : {}
      const reference = body.reference || `mock_${Date.now()}`
      return send(200, {
        status: true,
        message: 'Authorization URL created',
        data: {
          authorization_url: `http://127.0.0.1:${port}/pay/${reference}`,
          access_code: `ac_${reference}`,
          reference,
        },
      })
    }
    const m = url.pathname.match(/^\/transaction\/verify\/(.+)$/)
    if (req.method === 'GET' && m) {
      const reference = decodeURIComponent(m[1])
      const ok = !reference.includes('FAIL')
      return send(200, {
        status: true,
        message: 'Verification successful',
        data: {
          id: 1,
          domain: 'test',
          status: ok ? 'success' : 'failed',
          reference,
          amount: 500000,
          message: null,
          gateway_response: ok ? 'Successful' : 'Declined',
          paid_at: ok ? new Date().toISOString() : null,
          created_at: new Date().toISOString(),
          channel: 'card',
          currency: 'NGN',
          authorization: { authorization_code: 'AUTH_mock' },
        },
      })
    }
    if (req.method === 'GET' && url.pathname.startsWith('/pay/')) {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      return res.end('<h1>Mock Paystack checkout</h1><p>(local test double, no real payment)</p>')
    }
    send(404, { status: false, message: 'not found' })
  })
})
server.listen(port, '127.0.0.1', () => console.log(`mock paystack on http://127.0.0.1:${port}`))
