package app.glassremote.tv;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.SystemClock;
import android.provider.Settings;
import android.util.Base64;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * The receiver that used to run on a computer, now inside the TV: serves the GlassRemote web app to phones on the
 * home network and relays their commands to this TV. Same endpoints and WebSocket messages as receiver/bridge.py.
 */
final class Server {
    private static final String TAG = "GlassRemoteTv";
    private static final String WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    private static final int MAX_CONNECTIONS = 24;
    private static final int MAX_PER_PEER = 6;
    private static final int MAX_HEADERS = 64;
    private static final int MAX_HEAD_BYTES = 16 * 1024;
    private static final long HEAD_DEADLINE_MS = 10_000;
    private static final long AUTH_DEADLINE_MS = 10_000;
    private static final int MAX_PREAUTH_FRAME = 4096;

    private final Context ctx;
    private final TvLink tv;
    private final File scenesFile;
    final Auth auth;
    volatile int port;
    private final List<Ws> clients = new CopyOnWriteArrayList<>();
    private final ThreadPoolExecutor connPool = new ThreadPoolExecutor(MAX_CONNECTIONS, MAX_CONNECTIONS, 30, TimeUnit.SECONDS, new LinkedBlockingQueue<Runnable>(8));
    private final ExecutorService pool = Executors.newCachedThreadPool();
    private final Map<String, Integer> peerCounts = new HashMap<>();
    private ServerSocket server;

    Server(Context ctx, TvLink tv) {
        this.ctx = ctx;
        this.tv = tv;
        this.scenesFile = new File(ctx.getFilesDir(), "scenes.json");
        this.auth = new Auth(ctx);
        this.port = auth.port();
        connPool.allowCoreThreadTimeOut(true);
    }

    void start() throws IOException {
        IOException last = null;
        for (int i = 0; i < 10; i++) {
            server = new ServerSocket();
            server.setReuseAddress(true);
            try {
                server.bind(new InetSocketAddress(port), 50);
                last = null;
                break;
            } catch (IOException e) {
                last = e;
                try { server.close(); } catch (IOException ignored) { }
                port = auth.newPort();
            }
        }
        if (last != null) throw last;
        Thread t = new Thread(new Runnable() {
            public void run() {
                while (!server.isClosed()) {
                    try {
                        final Socket s = server.accept();
                        if (!admit(s)) continue;
                        try {
                            connPool.execute(new Runnable() {
                                public void run() {
                                    try { serve(s); } catch (Throwable e) { Log.w(TAG, "serve: " + e); } finally { release(s); }
                                }
                            });
                        } catch (RejectedExecutionException e) {
                            release(s);
                            try { s.close(); } catch (IOException ignored) { }
                        }
                    } catch (IOException e) {
                        if (server.isClosed()) break;
                        Log.w(TAG, "accept: " + e);
                        try { Thread.sleep(200); } catch (InterruptedException ignored) { }
                    } catch (Throwable e) {
                        Log.w(TAG, "accept: " + e);
                    }
                }
            }
        }, "http-accept");
        t.setDaemon(true);
        t.start();
        Log.i(TAG, "listening");
    }

    /** Refuses clients outside the home network, and limits how many connections one address can hold. */
    private boolean admit(Socket s) {
        try {
            if (!lanOnly(s.getInetAddress())) {
                s.close();
                return false;
            }
            String key = s.getInetAddress().getHostAddress();
            synchronized (peerCounts) {
                Integer n = peerCounts.get(key);
                if (n != null && n >= MAX_PER_PEER) {
                    s.close();
                    return false;
                }
                peerCounts.put(key, n == null ? 1 : n + 1);
            }
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    private void release(Socket s) {
        String key = s.getInetAddress().getHostAddress();
        synchronized (peerCounts) {
            Integer n = peerCounts.get(key);
            if (n == null || n <= 1) peerCounts.remove(key);
            else peerCounts.put(key, n - 1);
        }
        try { s.close(); } catch (IOException ignored) { }
    }

    void stop() {
        try { if (server != null) server.close(); } catch (IOException ignored) { }
        connPool.shutdownNow();
        pool.shutdownNow();
    }

    void broadcastState() {
        for (Ws c : clients) if (c.authed) c.sendText(state(c.host).toString());
    }

    // ---------- HTTP ----------

    private void serve(Socket s) {
        try {
            s.setSoTimeout(15000);
            InputStream in = new BufferedInputStream(s.getInputStream(), 8192);
            OutputStream out = s.getOutputStream();
            String line = readLine(in);
            if (line == null || line.isEmpty()) { s.close(); return; }
            String[] parts = line.split(" ");
            if (parts.length < 2) { s.close(); return; }
            String method = parts[0];
            String target = parts[1];
            Map<String, String> headers = new HashMap<>();
            String h;
            long t0 = System.currentTimeMillis();
            int used = line.length(), count = 0;
            while ((h = readLine(in)) != null && !h.isEmpty()) {
                used += h.length() + 2;
                if (++count > MAX_HEADERS || used > MAX_HEAD_BYTES || System.currentTimeMillis() - t0 > HEAD_DEADLINE_MS) {
                    s.close();
                    return;
                }
                int i = h.indexOf(':');
                if (i > 0) headers.put(h.substring(0, i).trim().toLowerCase(Locale.ROOT), h.substring(i + 1).trim());
            }
            String path = target;
            String queryStr = "";
            int q = target.indexOf('?');
            if (q >= 0) {
                path = target.substring(0, q);
                queryStr = target.substring(q + 1);
            }
            Map<String, String> query = parseQuery(queryStr);

            if (path.equals("/ws") && "websocket".equalsIgnoreCase(headers.get("upgrade"))) {
                webSocket(s, in, out, headers, query);
                return;
            }
            String token = headers.containsKey("x-gr-token") ? headers.get("x-gr-token") : query.get("token");
            boolean protectedCall = path.equals("/api/shortcut") || path.equals("/api/info") || path.equals("/api/stats") || path.equals("/api/open-link")
                    || path.equals("/api/clean-cache") || path.equals("/api/maintenance") || (path.equals("/api/scenes") && method.equals("PUT"));
            if (protectedCall && !auth.valid(token)) {
                json(out, 401, "{\"ok\":false,\"message\":\"PIN required\"}");
                s.close();
                return;
            }
            byte[] body = new byte[0];
            String cl = headers.get("content-length");
            if (cl != null) {
                int n = Math.max(0, Math.min(Integer.parseInt(cl.trim()), 65536));
                body = new byte[n];
                int off = 0;
                while (off < n) {
                    int r = in.read(body, off, n - off);
                    if (r < 0) break;
                    off += r;
                }
            }
            route(out, method, path, query, body);
            s.close();
        } catch (Exception e) {
            try { s.close(); } catch (IOException ignored) { }
        }
    }

    private void route(OutputStream out, String method, String path, Map<String, String> q, byte[] body) throws IOException, JSONException {
        if (path.equals("/api/scenes")) {
            if (method.equals("PUT")) {
                JSONArray cleaned = cleanScenes(new JSONArray(new String(body, StandardCharsets.UTF_8)));
                writeFile(scenesFile, cleaned.toString().getBytes(StandardCharsets.UTF_8));
                json(out, 200, cleaned.toString());
            } else {
                json(out, 200, loadScenes().toString());
            }
        } else if (path.equals("/api/shortcut")) {
            shortcut(out, q);
        } else if (path.equals("/api/discover")) {
            discover(out);
        } else if (path.equals("/api/info")) {
            info(out, q.get("host"));
        } else if (path.equals("/api/stats")) {
            try {
                json(out, 200, tv.stats());
            } catch (IOException e) {
                json(out, 503, "{\"ok\":false,\"message\":\"unreachable\"}");
            }
        } else if (path.equals("/api/clean-cache")) {
            if (!method.equals("POST")) {
                json(out, 405, "{\"ok\":false,\"message\":\"post_only\"}");
                return;
            }
            try {
                json(out, 200, "{\"ok\":true,\"freedMb\":" + tv.cleanCache() + ",\"message\":\"\"}");
            } catch (IOException e) {
                boolean soon = "too_soon".equals(e.getMessage());
                json(out, soon ? 429 : 503, "{\"ok\":false,\"message\":\"" + (soon ? "too_soon" : "unreachable") + "\"}");
            }
        } else if (path.equals("/api/open-link")) {
            if (!method.equals("POST")) {
                json(out, 405, "{\"ok\":false,\"message\":\"post_only\"}");
                return;
            }
            String link;
            try {
                link = new JSONObject(new String(body, StandardCharsets.UTF_8)).optString("url", "");
            } catch (JSONException e) {
                link = "";
            }
            String r = tv.openLink(link);
            json(out, r.equals("ok") ? 200 : r.equals("invalid_link") ? 400 : 503, "{\"ok\":" + r.equals("ok") + ",\"message\":\"" + r + "\"}");
        } else if (path.equals("/api/maintenance")) {
            maintenance(out, method, body);
        } else if (path.equals("/connect")) {
            String url = "http://" + lanIp() + ":" + port + "/";
            String html = "<!doctype html><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\">"
                    + "<body style=\"font:18px system-ui;background:#05060b;color:#f5f7fb;text-align:center;padding:40px\">"
                    + "<h1>GlassRemoteTv</h1><p>Open this address on your phone (same Wi-Fi):</p><p><b>" + url + "</b></p></body>";
            respond(out, 200, "text/html; charset=utf-8", html.getBytes(StandardCharsets.UTF_8));
        } else {
            asset(out, path);
        }
    }

    private void maintenance(OutputStream out, String method, byte[] body) throws IOException {
        Maintenance m = ReceiverService.maintenance;
        if (m == null) {
            json(out, 503, "{\"ok\":false,\"message\":\"not ready\"}");
            return;
        }
        if (method.equals("PUT")) {
            try {
                JSONObject r = new JSONObject(new String(body, StandardCharsets.UTF_8)).getJSONObject("reboot");
                Schedule.Config c = new Schedule.Config();
                c.enabled = r.getBoolean("enabled");
                c.freq = r.getString("freq");
                c.day = r.optInt("day", 1);
                c.hour = r.getInt("hour");
                c.minute = r.getInt("minute");
                if (!c.valid()) throw new JSONException("invalid");
                m.set(c);
            } catch (JSONException e) {
                json(out, 400, "{\"ok\":false,\"message\":\"invalid_settings\"}");
                return;
            } catch (IOException e) {
                json(out, 500, "{\"ok\":false,\"message\":\"save_failed\"}");
                return;
            }
        }
        Schedule.Config c = m.get();
        json(out, 200, "{\"ok\":true,\"reboot\":{\"enabled\":" + c.enabled + ",\"freq\":" + Stats.quote(c.freq) + ",\"day\":" + c.day
                + ",\"hour\":" + c.hour + ",\"minute\":" + c.minute + "},\"lastRebootMs\":" + m.lastRebootMs() + ",\"nextRebootMs\":" + m.nextMs()
                + ",\"note\":" + Stats.quote(m.note()) + ",\"nowMs\":" + System.currentTimeMillis()
                + ",\"tzOffsetMin\":" + java.util.TimeZone.getDefault().getOffset(System.currentTimeMillis()) / 60000 + "}");
    }

    private void asset(OutputStream out, String path) throws IOException {
        if (path.equals("/")) path = "/index.html";
        if (path.contains("..") || path.contains("\\")) {
            respond(out, 404, "text/plain", "Not found".getBytes(StandardCharsets.UTF_8));
            return;
        }
        byte[] data;
        try (InputStream a = ctx.getAssets().open("www" + path)) {
            data = readAll(a);
        } catch (IOException e) {
            respond(out, 404, "text/plain", "Not found".getBytes(StandardCharsets.UTF_8));
            return;
        }
        respond(out, 200, mime(path), data);
    }

    private static String mime(String p) {
        String l = p.toLowerCase(Locale.ROOT);
        if (l.endsWith(".html")) return "text/html; charset=utf-8";
        if (l.endsWith(".js")) return "text/javascript; charset=utf-8";
        if (l.endsWith(".css")) return "text/css; charset=utf-8";
        if (l.endsWith(".png")) return "image/png";
        if (l.endsWith(".jpg") || l.endsWith(".jpeg")) return "image/jpeg";
        if (l.endsWith(".webmanifest")) return "application/manifest+json";
        if (l.endsWith(".json")) return "application/json";
        if (l.endsWith(".svg")) return "image/svg+xml";
        return "application/octet-stream";
    }

    private void json(OutputStream out, int status, String body) throws IOException {
        respond(out, status, "application/json; charset=utf-8", body.getBytes(StandardCharsets.UTF_8));
    }

    private void respond(OutputStream out, int status, String type, byte[] body) throws IOException {
        String reason = status == 200 ? "OK" : status == 403 ? "Forbidden" : status == 404 ? "Not Found" : status == 400 ? "Bad Request" : "Error";
        String head = "HTTP/1.1 " + status + " " + reason + "\r\nContent-Type: " + type + "\r\nContent-Length: " + body.length
                + "\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nX-Frame-Options: DENY\r\nReferrer-Policy: no-referrer\r\nConnection: close\r\n\r\n";
        out.write(head.getBytes(StandardCharsets.ISO_8859_1));
        out.write(body);
        out.flush();
    }

    // ---------- API ----------

    private void shortcut(OutputStream out, Map<String, String> q) throws IOException, JSONException {
        String action = q.containsKey("action") ? q.get("action") : "";
        String value = q.containsKey("value") ? q.get("value") : "";
        String msg;
        int status = 200;
        try {
            if (action.equals("wake")) {
                msg = tv.wake();
            } else if (action.equals("power_off")) {
                msg = tv.powerOff();
            } else if (action.equals("scene")) {
                JSONObject scene = findScene(value);
                if (scene == null) {
                    json(out, 404, "{\"ok\":false,\"message\":\"Unknown scene\"}");
                    return;
                }
                msg = tv.runScene(scene);
            } else if (action.equals("volume") || action.equals("sleep") || action.equals("app") || shortcutKey(action) != null) {
                tv.setEnabled(true);
                if (!tv.waitConnected(8)) {
                    json(out, 503, "{\"ok\":false,\"message\":\"TV unreachable\"}");
                    return;
                }
                if (action.equals("volume")) {
                    tv.setVolume(Integer.parseInt(value));
                    msg = "Volume set";
                } else if (action.equals("sleep")) {
                    tv.sleepTimer(Integer.parseInt(value));
                    msg = "Timer set";
                } else if (action.equals("app")) {
                    tv.launch(value);
                    msg = "App opened";
                } else {
                    tv.key(shortcutKey(action));
                    msg = "Done";
                }
            } else {
                json(out, 400, "{\"ok\":false,\"message\":\"Unknown action\"}");
                return;
            }
        } catch (NumberFormatException e) {
            json(out, 400, "{\"ok\":false,\"message\":\"Invalid value\"}");
            return;
        }
        JSONObject r = new JSONObject();
        r.put("ok", true);
        r.put("message", msg);
        json(out, status, r.toString());
    }

    private static String shortcutKey(String a) {
        switch (a) {
            case "mute": return "VOLUME_MUTE";
            case "volume_up": return "VOLUME_UP";
            case "volume_down": return "VOLUME_DOWN";
            case "home": return "HOME";
            case "back": return "BACK";
            case "play_pause": return "MEDIA_PLAY_PAUSE";
            default: return null;
        }
    }

    private void discover(OutputStream out) throws IOException, JSONException {
        String ip = lanIp();
        JSONObject t = new JSONObject();
        t.put("host", ip);
        t.put("brand", "androidtv");
        t.put("kind", "Android TV");
        t.put("supported", true);
        t.put("controllable", true);
        t.put("name", deviceName());
        JSONObject r = new JSONObject();
        r.put("tvs", new JSONArray().put(t));
        r.put("subnet", ip.substring(0, Math.max(0, ip.lastIndexOf('.'))) + ".0/24");
        json(out, 200, r.toString());
    }

    private void info(OutputStream out, String host) throws IOException, JSONException {
        int[] ports = {6466, 6467, 8008, 8009, 8443};
        String[] labels = {"Remote control", "Pairing", "Cast (HTTP)", "Cast (TLS)", "Cast (setup)"};
        JSONArray pa = new JSONArray();
        Integer latency = null;
        for (int i = 0; i < ports.length; i++) {
            long t0 = System.nanoTime();
            boolean open = false;
            try (Socket s = new Socket()) {
                s.connect(new InetSocketAddress("127.0.0.1", ports[i]), 300);
                open = true;
                if (ports[i] == 6466) latency = Math.max(1, (int) ((System.nanoTime() - t0) / 1000000));
            } catch (IOException ignored) { }
            pa.put(new JSONObject().put("port", ports[i]).put("label", labels[i]).put("open", open));
        }
        JSONObject control = new JSONObject();
        control.put("enabled", tv.enabled);
        control.put("connected", tv.connected);
        control.put("pairing", tv.needsPairing);
        if (tv.connected) {
            control.put("is_on", tv.isOn == null ? JSONObject.NULL : tv.isOn);
            control.put("current_app", tv.currentApp);
            control.put("volume", tv.hasVolume ? volume() : JSONObject.NULL);
            control.put("device", new JSONObject().put("manufacturer", tv.devVendor).put("model", tv.devModel).put("sw_version", tv.devSw));
        }
        JSONObject r = new JSONObject();
        r.put("host", host == null ? lanIp() : host);
        r.put("name", deviceName());
        r.put("manufacturer", Build.MANUFACTURER);
        r.put("model", Build.MODEL);
        r.put("cast_version", JSONObject.NULL);
        r.put("uptime_seconds", SystemClock.elapsedRealtime() / 1000);
        r.put("locale", Locale.getDefault().toString());
        r.put("connection", connectionType());
        r.put("update_available", JSONObject.NULL);
        r.put("udn", JSONObject.NULL);
        r.put("mac", JSONObject.NULL);
        r.put("latency_ms", latency == null ? JSONObject.NULL : latency);
        r.put("ports", pa);
        r.put("control", control);
        json(out, 200, r.toString());
    }

    private Object connectionType() {
        try {
            ConnectivityManager cm = (ConnectivityManager) ctx.getSystemService(Context.CONNECTIVITY_SERVICE);
            NetworkInfo ni = cm.getActiveNetworkInfo();
            if (ni == null) return JSONObject.NULL;
            if (ni.getType() == ConnectivityManager.TYPE_ETHERNET) return "Ethernet";
            if (ni.getType() == ConnectivityManager.TYPE_WIFI) return "Wi-Fi";
        } catch (Exception ignored) { }
        return JSONObject.NULL;
    }

    private JSONObject volume() throws JSONException {
        return new JSONObject().put("level", tv.volLevel).put("max", tv.volMax).put("muted", tv.volMuted);
    }

    JSONObject state(String host) {
        JSONObject o = new JSONObject();
        try {
            o.put("type", "state");
            o.put("host", host);
            o.put("enabled", tv.enabled);
            o.put("tv_connected", tv.connected);
            o.put("needs_pairing", tv.needsPairing);
            o.put("is_on", tv.connected && tv.isOn != null ? (Object) tv.isOn : JSONObject.NULL);
            o.put("current_app", tv.connected ? (Object) tv.currentApp : JSONObject.NULL);
            o.put("volume", tv.connected && tv.hasVolume ? (Object) volume() : JSONObject.NULL);
            o.put("sleep_at", tv.sleepAtMs > 0 ? (Object) (tv.sleepAtMs / 1000.0) : JSONObject.NULL);
            o.put("error", tv.error);
        } catch (JSONException ignored) { }
        return o;
    }

    // ---------- scenes ----------

    private JSONArray defaultScenes() throws JSONException {
        return new JSONArray()
                .put(new JSONObject().put("id", "cinema").put("name", "Cinema").put("icon", "film").put("color", "red")
                        .put("app", "com.netflix.ninja").put("volume", 30).put("timer", 0))
                .put(new JSONObject().put("id", "notte").put("name", "Night").put("icon", "moon").put("color", "indigo")
                        .put("app", "").put("volume", 10).put("timer", 30));
    }

    private JSONArray loadScenes() throws JSONException {
        try {
            if (scenesFile.exists()) return cleanScenes(new JSONArray(new String(readAll(new FileInputStream(scenesFile)), StandardCharsets.UTF_8)));
        } catch (Exception ignored) { }
        return defaultScenes();
    }

    private JSONObject findScene(String id) throws JSONException {
        JSONArray a = loadScenes();
        for (int i = 0; i < a.length(); i++) if (a.getJSONObject(i).optString("id").equals(id)) return a.getJSONObject(i);
        return null;
    }

    private static JSONArray cleanScenes(JSONArray raw) throws JSONException {
        JSONArray out = new JSONArray();
        for (int i = 0; i < raw.length() && out.length() < 8; i++) {
            JSONObject s = raw.optJSONObject(i);
            if (s == null) continue;
            String id = s.optString("id", "").toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]", "");
            if (id.length() > 24) id = id.substring(0, 24);
            if (id.isEmpty()) continue;
            String name = s.optString("name", id);
            if (name.length() > 24) name = name.substring(0, 24);
            String icon = s.optString("icon", "spark").replaceAll("[^a-z]", "");
            if (icon.isEmpty()) icon = "spark";
            if (icon.length() > 16) icon = icon.substring(0, 16);
            String color = s.optString("color", "indigo");
            if (!color.matches("red|orange|green|teal|indigo|pink")) color = "indigo";
            String app = s.optString("app", "").replaceAll("[^\\w.:/?=&%#@+\\-]", "");
            if (app.length() > 200) app = app.substring(0, 200);
            JSONObject c = new JSONObject().put("id", id).put("name", name).put("icon", icon).put("color", color).put("app", app);
            if (s.isNull("volume") || s.optString("volume", "").isEmpty()) c.put("volume", JSONObject.NULL);
            else c.put("volume", Math.max(0, Math.min(100, s.optInt("volume"))));
            c.put("timer", Math.max(0, Math.min(360, s.optInt("timer", 0))));
            out.put(c);
        }
        return out;
    }

    // ---------- WebSocket ----------

    private void webSocket(Socket s, InputStream in, OutputStream out, Map<String, String> headers, Map<String, String> q) throws Exception {
        String key = headers.get("sec-websocket-key");
        if (key == null) {
            respond(out, 400, "text/plain", "Bad request".getBytes(StandardCharsets.UTF_8));
            s.close();
            return;
        }
        MessageDigest sha = MessageDigest.getInstance("SHA-1");
        String accept = Base64.encodeToString(sha.digest((key + WS_GUID).getBytes(StandardCharsets.ISO_8859_1)), Base64.NO_WRAP);
        String resp = "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + accept + "\r\n\r\n";
        out.write(resp.getBytes(StandardCharsets.ISO_8859_1));
        out.flush();
        String host = q.containsKey("host") ? q.get("host") : lanIp();
        Ws ws = new Ws(s, out, host);
        ws.authed = auth.valid(q.get("token"));
        s.setSoTimeout(ws.authed ? 25000 : 5000);
        clients.add(ws);
        try {
            ws.sendText(ws.authed ? state(host).toString() : "{\"type\":\"auth_required\"}");
            ws.loop(in);
        } finally {
            clients.remove(ws);
            try { s.close(); } catch (IOException ignored) { }
        }
    }

    private final class Ws {
        final Socket s;
        final OutputStream out;
        final String host;
        final String peer;
        final long since = System.currentTimeMillis();
        volatile boolean authed;

        Ws(Socket s, OutputStream out, String host) {
            this.s = s;
            this.out = out;
            this.host = host;
            this.peer = s.getInetAddress().getHostAddress();
        }

        void loop(InputStream in) throws IOException {
            while (true) {
                int b0;
                try {
                    b0 = in.read();
                } catch (SocketTimeoutException e) {
                    if (!authed && System.currentTimeMillis() - since > AUTH_DEADLINE_MS) return;
                    sendFrame(0x9, new byte[0]);
                    continue;
                }
                if (b0 < 0) return;
                int b1 = in.read();
                if (b1 < 0) return;
                int op = b0 & 0x0F;
                boolean masked = (b1 & 0x80) != 0;
                long len = b1 & 0x7F;
                if (len == 126) len = (in.read() << 8) | in.read();
                else if (len == 127) {
                    len = 0;
                    for (int i = 0; i < 8; i++) len = (len << 8) | in.read();
                }
                if (len < 0 || len > (authed ? 1 << 20 : MAX_PREAUTH_FRAME)) return;
                byte[] mask = new byte[4];
                if (masked) readFully(in, mask);
                byte[] data = new byte[(int) len];
                readFully(in, data);
                if (masked) for (int i = 0; i < data.length; i++) data[i] ^= mask[i & 3];
                if (op == 0x8) {
                    sendFrame(0x8, new byte[0]);
                    return;
                } else if (op == 0x9) {
                    sendFrame(0xA, data);
                } else if (op == 0x1) {
                    onMessage(new String(data, StandardCharsets.UTF_8), this);
                }
            }
        }

        void sendText(String t) { sendFrame(0x1, t.getBytes(StandardCharsets.UTF_8)); }

        synchronized void sendFrame(int op, byte[] data) {
            try {
                ByteArrayOutputStream f = new ByteArrayOutputStream();
                f.write(0x80 | op);
                if (data.length < 126) {
                    f.write(data.length);
                } else if (data.length < 65536) {
                    f.write(126);
                    f.write(data.length >> 8);
                    f.write(data.length & 0xFF);
                } else {
                    f.write(127);
                    for (int i = 7; i >= 0; i--) f.write((int) (((long) data.length >> (8 * i)) & 0xFF));
                }
                f.write(data);
                out.write(f.toByteArray());
                out.flush();
            } catch (IOException e) {
                try { s.close(); } catch (IOException ignored) { }
            }
        }
    }

    private void onMessage(String text, final Ws ws) {
        final JSONObject m;
        try {
            m = new JSONObject(text);
        } catch (JSONException e) {
            return;
        }
        String type = m.optString("type");
        if (type.equals("auth")) {
            String token = m.has("pin") ? auth.login(m.optString("pin"), ws.peer) : (auth.valid(m.optString("token")) ? m.optString("token") : null);
            if (token == null) ws.sendText("{\"type\":\"auth_error\",\"code\":\"bad_pin\"}");
            else if (token.equals("locked")) ws.sendText("{\"type\":\"auth_error\",\"code\":\"pin_locked\"}");
            else {
                ws.authed = true;
                try { ws.s.setSoTimeout(25000); } catch (IOException ignored) { }
                ws.sendText("{\"type\":\"auth_ok\",\"token\":\"" + token + "\"}");
                ws.sendText(state(ws.host).toString());
            }
            return;
        }
        if (!ws.authed) return;
        try {
            if (type.equals("pair")) {
                final String code = m.optString("code");
                pool.execute(new Runnable() { public void run() { tv.pair(code); broadcastState(); } });
            } else if (type.equals("set_enabled")) {
                final boolean on = m.optBoolean("enabled");
                pool.execute(new Runnable() { public void run() { tv.setEnabled(on); broadcastState(); } });
            } else if (type.equals("scene")) {
                final JSONObject scene = findScene(m.optString("id"));
                if (scene != null && tv.connected) pool.execute(new Runnable() { public void run() { tv.runScene(scene); } });
            } else if (type.equals("wake")) {
                pool.execute(new Runnable() { public void run() { tv.wake(); } });
            } else if (type.equals("sleep_timer")) {
                tv.sleepTimer(Math.max(0, Math.min(360, m.optInt("minutes", 0))));
            } else if (type.equals("set_volume") && tv.connected) {
                tv.setVolume(m.optInt("level", 0));
            } else if (tv.connected) {
                if (type.equals("key")) tv.key(m.optString("key"));
                else if (type.equals("text")) tv.text(m.optString("text"));
                else if (type.equals("launch")) tv.launch(m.optString("package"));
            }
        } catch (Exception e) {
            JSONObject err = new JSONObject();
            try {
                err.put("type", "error");
                err.put("message", String.valueOf(e.getMessage()));
                ws.sendText(err.toString());
            } catch (JSONException ignored) { }
        }
    }

    // ---------- helpers ----------

    private static boolean lanOnly(InetAddress a) {
        if (a.isLoopbackAddress() || a.isSiteLocalAddress() || a.isLinkLocalAddress()) return true;
        byte[] b = a.getAddress();
        return b.length == 16 && (b[0] & 0xFE) == 0xFC;
    }

    String lanIp() {
        try {
            Enumeration<NetworkInterface> nis = NetworkInterface.getNetworkInterfaces();
            while (nis.hasMoreElements()) {
                NetworkInterface ni = nis.nextElement();
                if (!ni.isUp() || ni.isLoopback()) continue;
                Enumeration<InetAddress> as = ni.getInetAddresses();
                while (as.hasMoreElements()) {
                    InetAddress a = as.nextElement();
                    if (a instanceof Inet4Address && !a.isLoopbackAddress()) return a.getHostAddress();
                }
            }
        } catch (Exception ignored) { }
        return "127.0.0.1";
    }

    private String deviceName() {
        String n = null;
        try { n = Settings.Global.getString(ctx.getContentResolver(), "device_name"); } catch (Exception ignored) { }
        return n == null || n.isEmpty() ? Build.MODEL : n;
    }

    private static Map<String, String> parseQuery(String s) {
        Map<String, String> m = new HashMap<>();
        for (String p : s.split("&")) {
            if (p.isEmpty()) continue;
            int i = p.indexOf('=');
            try {
                String k = URLDecoder.decode(i < 0 ? p : p.substring(0, i), "UTF-8");
                String v = i < 0 ? "" : URLDecoder.decode(p.substring(i + 1), "UTF-8");
                m.put(k, v);
            } catch (Exception ignored) { }
        }
        return m;
    }

    private static String readLine(InputStream in) throws IOException {
        StringBuilder sb = new StringBuilder();
        int c;
        while ((c = in.read()) >= 0) {
            if (c == '\n') break;
            if (c != '\r') sb.append((char) c);
            if (sb.length() > 8192) throw new IOException("line too long");
        }
        return c < 0 && sb.length() == 0 ? null : sb.toString();
    }

    private static void readFully(InputStream in, byte[] b) throws IOException {
        int off = 0;
        while (off < b.length) {
            int n = in.read(b, off, b.length - off);
            if (n < 0) throw new IOException("eof");
            off += n;
        }
    }

    private static byte[] readAll(InputStream in) throws IOException {
        try (InputStream i = in) {
            ByteArrayOutputStream o = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = i.read(buf)) > 0) o.write(buf, 0, n);
            return o.toByteArray();
        }
    }

    private static void writeFile(File f, byte[] d) throws IOException {
        try (FileOutputStream o = new FileOutputStream(f)) {
            o.write(d);
        }
    }
}
