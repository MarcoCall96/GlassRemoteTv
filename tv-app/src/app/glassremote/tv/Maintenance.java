package app.glassremote.tv;

import android.util.Log;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.TimeZone;

/** The optional automatic restart: a daily, weekly or monthly time at which the TV restarts itself, but only while it is in standby. */
final class Maintenance {
    private static final String TAG = "GlassRemoteTv";
    private static final long RETRY_MS = 30 * 60000L;
    private static final long GIVE_UP_MS = 6 * 3600000L;
    private static final long MIN_GAP_MS = 12 * 3600000L;

    private final File file;
    private final TvLink tv;
    private Schedule.Config cfg = new Schedule.Config();
    private long lastRebootMs, dueMs, giveUpMs;
    private volatile String note = "";

    Maintenance(File filesDir, TvLink tv) {
        this.file = new File(filesDir, "maintenance.txt");
        this.tv = tv;
        load();
    }

    synchronized Schedule.Config get() {
        Schedule.Config c = new Schedule.Config();
        c.enabled = cfg.enabled;
        c.freq = cfg.freq;
        c.day = cfg.day;
        c.hour = cfg.hour;
        c.minute = cfg.minute;
        return c;
    }

    synchronized void set(Schedule.Config c) throws IOException {
        Schedule.Config old = cfg;
        cfg = c;
        try {
            save();
        } catch (IOException e) {
            cfg = old;
            throw e;
        }
        dueMs = 0;
        giveUpMs = 0;
        note = "";
    }

    synchronized long lastRebootMs() { return lastRebootMs; }

    synchronized long nextMs() {
        if (!cfg.enabled) return 0;
        if (dueMs == 0) dueMs = Schedule.nextRun(cfg, System.currentTimeMillis(), TimeZone.getDefault());
        return dueMs;
    }

    String note() { return note; }

    void start() {
        Thread t = new Thread(new Runnable() {
            public void run() {
                while (true) {
                    try {
                        Thread.sleep(20000);
                        check();
                    } catch (InterruptedException e) {
                        return;
                    } catch (Throwable e) {
                        Log.w(TAG, "maintenance: " + e);
                    }
                }
            }
        }, "maintenance");
        t.setDaemon(true);
        t.start();
    }

    private long lastCheckMs;

    private void check() throws IOException {
        long now = System.currentTimeMillis();
        long due;
        synchronized (this) {
            // the clock moved (for example the TV just synchronised it): forget the cached time and compute it again
            if (lastCheckMs != 0 && (now < lastCheckMs || now - lastCheckMs > 5 * 60000L)) dueMs = 0;
            lastCheckMs = now;
            if (!cfg.enabled) return;
            due = nextMs();
        }
        if (now < due) return;
        synchronized (this) {
            if (giveUpMs == 0) giveUpMs = due + GIVE_UP_MS;
            boolean justBooted = android.os.SystemClock.elapsedRealtime() < 10 * 60000L;
            boolean tooSoon = lastRebootMs <= now && now - lastRebootMs < MIN_GAP_MS;
            if (now > giveUpMs || justBooted || tooSoon) {
                note = "skipped";
                giveUpMs = 0;
                dueMs = Schedule.nextRun(cfg, now, TimeZone.getDefault());
                return;
            }
        }
        String r = tv.rebootIfStandby();
        synchronized (this) {
            if (r.equals("rebooting")) {
                lastRebootMs = now;
                giveUpMs = 0;
                dueMs = Schedule.nextRun(cfg, now + 60000, TimeZone.getDefault());
                note = "";
                save();
            } else {
                note = r;
                dueMs = now + RETRY_MS;
            }
        }
    }

    // ---------- storage (plain "key=value" lines) ----------

    private synchronized void load() {
        try {
            if (!file.exists()) return;
            byte[] d = readAll(file);
            for (String line : new String(d, StandardCharsets.UTF_8).split("\n")) {
                int i = line.indexOf('=');
                if (i < 0) continue;
                String k = line.substring(0, i).trim(), v = line.substring(i + 1).trim();
                if (k.equals("enabled")) cfg.enabled = v.equals("true");
                else if (k.equals("freq")) cfg.freq = v;
                else if (k.equals("day")) cfg.day = Integer.parseInt(v);
                else if (k.equals("hour")) cfg.hour = Integer.parseInt(v);
                else if (k.equals("minute")) cfg.minute = Integer.parseInt(v);
                else if (k.equals("last")) lastRebootMs = Long.parseLong(v);
            }
            if (!cfg.valid()) cfg = new Schedule.Config();
        } catch (IOException | RuntimeException e) {
            cfg = new Schedule.Config();
        }
    }

    private synchronized void save() throws IOException {
        String s = "enabled=" + cfg.enabled + "\nfreq=" + cfg.freq + "\nday=" + cfg.day + "\nhour=" + cfg.hour + "\nminute=" + cfg.minute
                + "\nlast=" + lastRebootMs + "\n";
        File tmp = new File(file.getPath() + ".tmp");
        try (FileOutputStream o = new FileOutputStream(tmp)) {
            o.write(s.getBytes(StandardCharsets.UTF_8));
        }
        if (!tmp.renameTo(file)) throw new IOException("could not save");
    }

    private static byte[] readAll(File f) throws IOException {
        try (FileInputStream in = new FileInputStream(f)) {
            ByteArrayOutputStream b = new ByteArrayOutputStream();
            byte[] buf = new byte[512];
            int n;
            while ((n = in.read(buf)) > 0 && b.size() < 4096) b.write(buf, 0, n);
            return b.toByteArray();
        }
    }
}
