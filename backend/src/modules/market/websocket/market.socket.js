// manages continuous data delivery to our frontend 
// used ws instead of socket.io as ws has better performance and lower payload



/*
[ User Opens Browser ]
          ↓
[ WebSocket Handshake ]
(ws converts HTTP → persistent connection)
          ↓
[ Connection Established ]
          ↓
[ User Selects Symbol + Interval ]
          ↓
[ ws.on('message') Triggered ]
          ↓
[ Store subscription on client socket ]
(client.symbol, client.interval)
          ↓
────────────────────────────────────
🔁 BACKGROUND LOOPS START
────────────────────────────────────

(Every 30 sec)
[ Heartbeat Ping ]
ws.ping() → keep connection alive

(Every 1 min)
          ↓
[ Loop through wss.clients ]
          ↓
[ Filter only active clients (readyState === OPEN) ]
          ↓
[ Build Set of Unique Subscriptions ]
(e.g., BTC|1m, ETH|5m)
          ↓
[ For each unique subscription ]
          ↓
[ Check Cache (node-cache) ]
        ↓             ↓
   [Cache Hit]     [Cache Miss]
        ↓             ↓
 [Use RAM Data]   [Call API via axios]
                      ↓
              [Fetch 100 candles]
                      ↓
              [Store in Cache]

          ↓
[ Format Data ]
- parseFloat()
- reverse() → oldest → newest

          ↓
[ Convert to JSON Payload ]
(JSON.stringify)

          ↓
[ Broadcast Loop (wss.clients) ]
          ↓
[ Match client subscription ]
(symbol + interval)
          ↓
[ Send data (client.send) ONLY if match ]

────────────────────────────────────
❌ DISCONNECT FLOW
────────────────────────────────────

[ User Closes Tab ]
          ↓
[ ws.on('close') Triggered ]
          ↓
[ clearInterval() ]
(stop heartbeat timer → prevent memory leak)

────────────────────────────────────
🛡️ ERROR HANDLING LAYER
────────────────────────────────────

1. [ JSON Parse Guard ]
   try-catch → prevent crash

2. [ ReadyState Check ]
   send only if OPEN (1)

3. [ API Error Guard ]
   if API fails → fallback to cached data
*/


import { WebSocketServer } from 'ws'
import { fetchForexData } from '../services/market.service.js' // Bug 4 fixed: react import hataya

export const setupMarketWS = (server) => {
    const wss = new WebSocketServer({ server })

    wss.on('connection', (ws) => {
        console.log('Real time Stream Active')

        ws.subscribedSymbol = 'EUR/USD'
        ws.subscribedInterval = '1h'

        ws.on('message', (message) => {
            try {
                const payload = JSON.parse(message)
                if (payload.type === 'SUBSCRIBE') {
                    ws.subscribedSymbol = payload.symbol.toUpperCase()
                    ws.subscribedInterval = payload.interval || '1h'
                    console.log(ws.subscribedSymbol, ws.subscribedInterval)
                }
            } catch (err) {
                console.error('Wrong subscription request')
            }
        })

        const heartbeat = setInterval(() => { // Bug 1 fixed: setInterval capital I
            if (ws.readyState === ws.OPEN) ws.ping()
        }, 30000)

        ws.on('close', () => {
            clearInterval(heartbeat)
            console.log('Client disconnected')
        })
    })

    const broadcastTargetedUpdates = async () => {
        const activeSubscriptions = new Set()

        wss.clients.forEach(client => {
            if (client.readyState === 1) {
                activeSubscriptions.add(`${client.subscribedSymbol}|${client.subscribedInterval}`)
            }
        })

        for (const sub of activeSubscriptions) {
            const [symbol, interval] = sub.split('|') // Bug 2 fixed: inside the loop

            try {
                const result = await fetchForexData(symbol, interval)

                if (result.success) {
                    const payload = JSON.stringify({ // Bug 3 fixed: inside try, before forEach
                        type: 'CANDLE_DATA',
                        symbol: symbol,
                        data: result.data
                    })

                    wss.clients.forEach((client) => {
                        if (
                            client.readyState === 1 &&
                            client.subscribedSymbol === symbol &&
                            client.subscribedInterval === interval
                        ) {
                            client.send(payload)
                        }
                    })
                }
            } catch (err) {
                console.error('BROADCAST ERROR:', err.message)
            }
        }
    }

    setInterval(() => { // Bug 1 fixed here too
        broadcastTargetedUpdates()
    }, 60000) // 1 min — 1800000 (30 min) was too long for live data

    return wss
}

