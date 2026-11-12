package app.glassremote.tv;

import android.util.Log;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * App side of {@link Injector}: keeps one extra debug connection open whose shell runs the injector, and writes key
 * codes to it. If anything goes wrong the caller falls back to the slow "input keyevent" path.
 */
final class KeyInjector {
    private static final String TAG = "GlassRemoteTv";

    private final Identity id;
    private final String apkPath;
    private Adb adb;
    private volatile Adb.Stream stream;
    private volatile long lastUse = System.currentTimeMillis();
    private long retryAfter;
    private boolean starting;

    private static final long IDLE_MS = 10 * 60000L;

    KeyInjector(Identity id, String apkPath) {
        this.id = id;
        this.apkPath = apkPath;
    }

    boolean ready() {
        Adb.Stream s = stream;
        return s != null && !s.isClosed();
    }

    /** The helper process holds about 60 MB, so it stops when no key was sent for a while and starts again on the next key. */
    void idleCheck() {
        if (ready() && System.currentTimeMillis() - lastUse > IDLE_MS) {
            Log.i(TAG, "key injector stopped (idle)");
            close();
        }
    }

    /** Sends the keys; false means the caller must use the slow path. */
    synchronized boolean tap(int[] codes) {
        Adb.Stream s = stream;
        if (s == null || s.isClosed()) return false;
        lastUse = System.currentTimeMillis();
        StringBuilder sb = new StringBuilder("K");
        for (int c : codes) sb.append(' ').append(c);
        try {
            s.write(sb.append('\n').toString().getBytes(StandardCharsets.US_ASCII));
            return true;
        } catch (IOException e) {
            close();
            return false;
        }
    }

    synchronized void close() {
        Adb.Stream s = stream;
        stream = null;
        if (s != null) s.close();
        if (adb != null) adb.close();
        adb = null;
    }

    /** Starts the injector on its own debug connection. Slow (about a second): never call it on the key path. */
    void warmUp() {
        synchronized (this) {
            if (ready() || starting || System.currentTimeMillis() < retryAfter) return;
            starting = true;
        }
        Adb a = null;
        try {
            a = new Adb(id);
            a.connect("127.0.0.1", 5555, null, 3000);
            String cmd = "stty -echo 2>/dev/null; CLASSPATH='" + apkPath.replace("'", "") + "' exec app_process /system/bin app.glassremote.tv.Injector";
            Adb.Stream s = a.openStream(cmd);
            for (int i = 0; i < 40 && !s.output().contains("READY"); i++) {
                if (s.isClosed()) throw new IOException("injector stopped: " + s.output());
                Thread.sleep(150);
            }
            if (!s.output().contains("READY")) throw new IOException("injector did not answer");
            synchronized (this) {
                adb = a;
                stream = s;
                lastUse = System.currentTimeMillis();
            }
            a = null;
            Log.i(TAG, "key injector ready");
        } catch (Throwable e) {
            Log.w(TAG, "injector: " + e + "; using the slow path");
            retryAfter = System.currentTimeMillis() + 30000;
        } finally {
            if (a != null) a.close();
            synchronized (this) { starting = false; }
        }
    }
}
