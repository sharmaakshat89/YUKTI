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



import {WebSocketServer} from 'ws' //websocket server class which is stateful
import { fetchForexData } from '../services/market.service'
import { act } from 'react'

export const setupMarketWS = (server) =>{ // server is an express server instance, ye vahan app.listen se milta hai 
    const wss= new WebSocketServer({server}) // websocket wrapped over our existing express server

    wss.on('connection' , (ws)=>{// accepting connection of a new user, when he visits the site and logs in

        console.log('Real time Stream Active')

        //default values 
        ws.subscribedSymbol= 'EUR/USD'
        ws.subscribedInterval= '1h'

        //when user changes the currency pair or timeframe
        ws.on('message', (message)=>{// this 'message' keyword will update via frontend whenthe user changes via dropdown menu
            try{
                const payload = JSON.parse(message) //conv incoming msg to JSON
                if (payload.type==='SUBSCRIBE'){
                    //IF USER CHANGED CURR OR TIMEFR
                    ws.subscribedSymbol=payload.symbol.toUpperCase() //changes the symbol on selection
                    ws.subscribedInterval=payload.interval || '1h' //changes the timeframe or defaults to 1hr
                    console.log(ws.subscribedSymbol , ws.subscribedInterval)

                }
            }catch(err){console.error('wrong subscription request')}
        })



        //keeps conn alive to prevent timeouts
        const heartbeat= setinterval(()=>{// returns a timeout obj
            if(ws.readyState===ws.OPEN) ws.ping() // telling client that live server is active
        },30000) //30000 ms means 30 seconds ka interval


        ws.on('close',()=>{clearInterval(heartbeat)// when user closes the TAB stopping that setTimeout
            console.log('Client disconnected')})
    })



    //TARGETED BROADCAST , ONLY to users who have selected the curr and timeframe
    // we will Broadcast : 1 api call will send data  to all users of that combo to preserve api calls
    const broadcastTargetedUpdates= async ()=>{

        // for all common combos
        const activeSubscriptions = new Set() // type-agnostic collection that stores uniq values and insertion order
        wss.clients.forEach(client=>{ //Agar 100 users same symbol dekh rahe to api ko sirf ek API request jayegi
            if(client.readyState===1){
                activeSubscriptions.add(`${client.subscribedSymbol} |
                     ${client.subscribedInterval}`)// .add combines into string like combining symbol and interval to a string example 'USD/INR|1H'
            }
        })

        //looping thru each subscription combo
        for(const sub of activeSubscriptions){
            const [symbol,interval]= sub.split('|')// TAKES WHAT WE GENERATED ABOVE AND SPLIT INTO symbol and interval
        }

        try{
            const result= await fetchForexData(symbol, interval) // node cache will be used here
            if(result.success){
                const payload = JSON.stringify({ //MAKING THE PAYLOAD : converting the JSON obj to STRING form
                    type:"CANDLE_DATA",
                    symbol:symbol,
                    data:result.data //100 prev and present candle data
                })
            }
            //going thru all users on frontend
            wss.clients.forEach((client)=>{ // Hum har user ke liye fetchForexData call nahi karenge, ek baar data lakar sabko baant rahe hain
                if(client.readyState===1 && client.subscribedSymbol===symbol && client.subscribedInterval===interval) //if client/user is using the app on his tab
                {client.send(payload)} //pushing the user-relevant data to each user who is on the website
            })
        
        
        }catch(err){
            console.error('BROADCAST ERROR:', err.message)
        }
    }

    // checking data after a fixed interval
    setinterval(()=>{
        broadcastTargetedUpdates('EUR/USD', '1h')
    },1800000)

    return wss


}


/*
Connection Handshake: Sabse pehle user browser kholta hai aur hamare server se judta hai.
 Yahan ws (WebSocketServer) tool use hota hai jo HTTP connection ko live stream mein badal deta hai
.
Subscription Logging: User frontend par symbol (e.g., USD/JPY) aur timeframe (e.g., 1day) select karta hai. 
Backend mein ws.on('message') event trigger hota hai aur hum us user ke preferences ko uske socket object par chipka dete hain.
Global Heartbeat: Background mein ek setInterval (Node.js timer tool) chalta rehta hai jo har 30 seconds mein ws.ping() bhejta hai 
taaki connection "zinda" rahe aur proxy servers use kaat na dein.
Active List Filtering: Har 1 minute mein (ya jo bhi polling time ho), hamara engine wss.clients (WebSocket Client Set) par loop chalata hai
 aur ek Set object (JS tool for unique values) banata hai.
  Yeh check karta hai ki abhi total kitne unique combinations (jaise USD/JPY-1h, EUR/USD-1day) active hain.
Smart Data Fetching: Ab system fetchForexData function ko call karta hai. 
Isme hum axios (HTTP tool) use karte hain Twelve Data API se 100 candles mangwane ke liye
.
The Memory Guard (Cache): API hit karne se pehle hum node-cache tool check karte hain.
 Agar wahi data 60 seconds purana RAM mein pada hai, toh hum Twelve Data ko request nahi bhejte, 
 seedha RAM se utha lete hain (Credits bachaane ka asli jugaad).
Forensic Formatting: Jo data milta hai, use hum parseFloat() se numbers mein badalte hain
 aur .reverse() (JS Array method) karte hain taaki data "Oldest-to-Newest" order mein ho jaye, jo hamare future indicators ke liye zaroori hai
.
Targeted Broadcasting: 
Ab hum JSON.stringify() se data ko ek string packet (payload) banate hain
 aur wss.clients.forEach loop chalate hain. 
 Yahan ek "if-condition" filter lagta hai: sirf unhi users ko data client.send() kiya jata hai
 jinka label (symbol + interval) hamare data se match karta hai.
Resource Cleanup: Jab user tab band karta hai, toh ws.on('close') event trigger hota hai. 
Hum clearInterval() tool use karke us user ka heartbeat timer kill kar dete hain taaki server ki RAM faltu mein bhari na rahe (Memory Leak prevention).

Error Checks kahan-kahan hain? (Simple Bhasha Mein):
JSON Guard: Agar client koi ganda/malformed message bhejta hai, toh try-catch block use pakad leta hai taaki backend crash na ho.
ReadyState Check: Data push karne se pehle hum hamesha check karte hain ki client ka connection 1 (OPEN) hai ya nahi.
 Agar connection half-dead hai, toh hum data nahi bhejte.
API Response Guard: Agar Twelve Data API "Error" ya "Limit Reached" bolti hai, 
toh hamara catch block use handle karta hai 
aur purana cached data hi dikhata rehta hai taaki UI khali na dikhe.
*/