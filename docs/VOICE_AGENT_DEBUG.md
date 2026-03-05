# Voice Agent Tool Call Debugging

## Server-side logs

The backend logs tool calls to stdout. Watch the terminal where the backend runs, or check `.run/backend.log`:

```
[VoiceController] executeToolCall { toolName: 'get_user_profile', userId: '...', argsKeys: [] }
[VoiceController] executeToolCall success: get_user_profile
```

If you see `userId: 'none'` or `rejected: no userId`, the request is missing a valid JWT.

## Client-side logs (Metro)

When running `npx expo start`, tool calls log to the Metro bundler terminal:

```
[useElevenVoiceAgent] Tool call: get_user_profile -> http://192.168.30.146:4000/api/voice/tool-call
[useElevenVoiceAgent] Tool result: get_user_profile {...}
```

On failure:
```
[useElevenVoiceAgent] Tool failed: get_user_profile Network request failed (HTTP 0) URL: http://...
```

## iPhone logs (physical device)

1. Connect the iPhone to your Mac via USB.
2. Open **Console.app** (Applications → Utilities).
3. Select your iPhone in the left sidebar.
4. In the search bar, filter by your app name (e.g. `Ora` or `OraAI`).
5. Start a voice session and trigger a tool call — logs will appear in real time.

## API base URL config

The app uses `EXPO_PUBLIC_API_BASE_URL` from `frontend/.env`. On a physical device, this must be your Mac’s LAN IP (not `localhost`).

**Get your Mac’s IP:**
```bash
ipconfig getifaddr en0
```

**Update `frontend/.env`:**
```
EXPO_PUBLIC_API_BASE_URL=http://YOUR_MAC_IP:4000
API_BASE_URL=http://YOUR_MAC_IP:4000
```

Restart Metro after changing `.env`.

## Common issues

| Symptom | Possible cause |
|---------|----------------|
| `userId: 'none'` in server logs | JWT missing or invalid; auth not set |
| `HTTP 0` or `Network request failed` | iPhone can’t reach Mac (wrong IP, different WiFi, firewall) |
| No server logs at all | Request never reaches backend; check URL in client logs |
| Tool succeeds but agent doesn’t use result | ElevenLabs SDK callback format; check `maybeResolveClientTool` |
