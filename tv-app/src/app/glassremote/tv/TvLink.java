package app.glassremote.tv;

import android.os.Build;
import android.util.Log;
import android.view.KeyEvent;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Controls this TV through its own debug service (ADB over the loopback network): the TV's built-in remote service
 * refuses connections that come from the TV itself, while the debug service does not.
 * Needs "Network debugging" turned on in the TV's developer options, and one tap on "Allow" the first time.
 */
final class TvLink {
    interface Listener { void changed(); }

    private static final String TAG = "GlassRemoteTv";
    private static final Pattern FOCUS = Pattern.compile("mCurrentFocus=Window\\{[^ ]+ u\\d+ ([\\w.]+)/");
    private static final Pattern VOLUME = Pattern.compile("volume is (\\d+) in range \\[(\\d+)\\.\\.(\\d+)\\]");

    private final Identity id;
    private final Listener listener;
    private final Adb adb;
    private final Object connectLock = new Object();
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final ScheduledExecutorService sched = Executors.newSingleThreadScheduledExecutor();
    private final List<Integer> pendingKeys = new ArrayList<>();
    private boolean drainScheduled;
    volatile KeyInjector injector;

    volatile boolean enabled, connected;
    final boolean needsPairing = false;
    volatile String error = "";
    volatile Boolean isOn = null;
    volatile String currentApp = "";
    volatile boolean hasVolume, volMuted;
    volatile int volLevel, volMax = 100;
    final String devModel = Build.MODEL, devVendor = Build.MANUFACTURER, devSw = Build.VERSION.RELEASE;
    volatile long sleepAtMs = 0;
    private ScheduledFuture<?> sleepTask;
    private int pollCount;

    TvLink(Identity id, Listener listener) {
        this.id = id;
        this.listener = listener;
        this.adb = new Adb(id);
    }

    void start() {
        Thread t = new Thread(new Runnable() {
            public void run() {
                while (true) {
                    try {
                        if (enabled && !connected) {
                            connectOnce();
                            Thread.sleep(connected ? 1000 : 5000);
                        } else if (enabled && connected) {
                            poll();
                            KeyInjector k = injector;
                            if (k != null) k.idleCheck();
                            Thread.sleep(2500);
                        } else {
                            Thread.sleep(1000);
                        }
                    } catch (InterruptedException e) {
                        return;
                    } catch (Throwable e) {
                        Log.w(TAG, "supervisor: " + e);
                    }
                }
            }
        }, "tv-supervisor");
        t.setDaemon(true);
        t.start();
    }

    private void changed() {
        try { listener.changed(); } catch (Throwable ignored) { }
    }

    // ---------- connection ----------

    void connectOnce() {
        synchronized (connectLock) {
            if (!enabled || connected) return;
            try {
                adb.connect("127.0.0.1", 5555, new Adb.Prompt() {
                    public void waiting() {
                        error = "adb_authorize";
                        Log.i(TAG, "waiting for the user to allow the connection on the TV");
                        changed();
                    }
                }, 60000);
                connected = true;
                error = "";
                Log.i(TAG, "debug service connected");
                warmUpInjector();
                poll();
            } catch (Adb.NeedsAuthorization e) {
                connected = false;
                error = "adb_authorize";
            } catch (IOException e) {
                connected = false;
                boolean refused = String.valueOf(e.getMessage()).toLowerCase().contains("refused")
                        || e instanceof java.net.ConnectException;
                error = refused ? "adb_off" : (String.valueOf(e.getMessage()).equals("timeout") ? "adb_authorize" : "unreachable");
                Log.i(TAG, "debug service: " + e);
            }
        }
        changed();
    }

    void setEnabled(boolean on) {
        if (on == enabled) {
            changed();
            return;
        }
        enabled = on;
        if (on) {
            connectOnce();
        } else {
            adb.close();
            if (injector != null) injector.close();
            connected = false;
            error = "";
            changed();
        }
    }

    void pair(String code) { /* no pairing code in this mode */ }

    boolean waitConnected(int seconds) {
        for (int i = 0; i < seconds * 4 && !connected; i++) {
            try { Thread.sleep(250); } catch (InterruptedException e) { break; }
        }
        return connected;
    }

    private void lost(IOException e) {
        Log.i(TAG, "debug connection lost: " + e);
        adb.close();
        if (injector != null) injector.close();
        connected = false;
        isOn = null;
        changed();
    }

    private void warmUpInjector() {
        final KeyInjector k = injector;
        if (k == null || k.ready()) return;
        worker.execute(new Runnable() {
            public void run() { k.warmUp(); }
        });
    }

    // ---------- status ----------

    private void poll() {
        if (!connected) return;
        try {
            String out = adb.exec("dumpsys window | grep mCurrentFocus; dumpsys power | grep mWakefulness=");
            boolean changed = false;
            Matcher m = FOCUS.matcher(out);
            if (m.find() && !m.group(1).equals(currentApp)) {
                currentApp = m.group(1);
                changed = true;
            }
            Boolean on = out.contains("mWakefulness=Awake") ? Boolean.TRUE : out.contains("mWakefulness=") ? Boolean.FALSE : isOn;
            standby = out.contains("mWakefulness=Asleep") || out.contains("mWakefulness=Dozing");
            if (on != isOn) {
                isOn = on;
                changed = true;
            }
            if (pollCount++ % 3 == 0) changed |= readVolume();
            if (changed) changed();
        } catch (IOException e) {
            lost(e);
        }
    }

    private boolean readVolume() throws IOException {
        Matcher m = VOLUME.matcher(adb.exec("media volume --stream 3 --get"));
        if (!m.find()) return false;
        int level = Integer.parseInt(m.group(1)), max = Integer.parseInt(m.group(3));
        boolean changed = !hasVolume || level != volLevel || max != volMax;
        volLevel = level;
        volMax = max;
        hasVolume = true;
        return changed;
    }

    // ---------- commands ----------

    private void shell(final String cmd) {
        worker.execute(new Runnable() {
            public void run() {
                try {
                    adb.exec(cmd);
                } catch (IOException e) {
                    lost(e);
                }
            }
        });
    }

    /** Keys pressed quickly in a row travel together in one command, so holding a button stays smooth. */
    boolean key(String name) {
        String n = name.toUpperCase();
        if (n.equals("SETTINGS")) {
            // many TVs ignore the settings key, so open the settings screen directly
            shell("am start -a android.settings.SETTINGS");
            return true;
        }
        if (n.equals("EXIT")) n = "ESCAPE";
        int code = KeyEvent.keyCodeFromString("KEYCODE_" + n);
        if (code == KeyEvent.KEYCODE_UNKNOWN) return false;
        KeyInjector inj = injector;
        if (inj != null) {
            if (inj.tap(new int[] { code })) return true;
            warmUpInjector();
        }
        synchronized (pendingKeys) {
            if (pendingKeys.size() < 12) pendingKeys.add(code);
            if (drainScheduled) return true;
            drainScheduled = true;
        }
        worker.execute(new Runnable() {
            public void run() {
                List<Integer> batch;
                synchronized (pendingKeys) {
                    batch = new ArrayList<>(pendingKeys);
                    pendingKeys.clear();
                    drainScheduled = false;
                }
                StringBuilder sb = new StringBuilder("input keyevent");
                for (int c : batch) sb.append(' ').append(c);
                try {
                    adb.exec(sb.toString());
                } catch (IOException e) {
                    lost(e);
                }
            }
        });
        return true;
    }

    void text(String text) {
        if (text == null || text.isEmpty()) return;
        text = text.replace("\u0000", "");
        if (text.length() > 512) text = text.substring(0, 512);
        String t = text.replace("%", "%%").replace(" ", "%s");
        shell("input text " + quote(t));
    }

    void launch(String link) {
        if (link == null || link.isEmpty()) return;
        if (link.contains("://")) {
            if (!Links.isWebLink(link)) return;
            shell("am start -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d " + quote(link));
        } else if (Links.isPackageName(link)) {
            String p = quote(link);
            shell("monkey -p " + p + " -c android.intent.category.LEANBACK_LAUNCHER 1 2>&1 | grep -q 'No activities' && monkey -p " + p
                    + " -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1");
        }
    }

    /** Opens a web link on the TV (waking it first if it is in standby). Returns "ok", "invalid_link" or "unreachable". */
    String openLink(String link) {
        if (!Links.isWebLink(link)) return "invalid_link";
        setEnabled(true);
        if (!waitConnected(10)) return "unreachable";
        poll();
        if (standby) {
            shell("input keyevent 224");
            try { Thread.sleep(2500); } catch (InterruptedException ignored) { }
        }
        launch(link);
        return "ok";
    }

    void setVolume(final int target) {
        final int t = Math.max(0, Math.min(100, target));
        worker.execute(new Runnable() {
            public void run() {
                try {
                    adb.exec("media volume --stream 3 --set " + t);
                    volLevel = t;
                    hasVolume = true;
                    changed();
                } catch (IOException e) {
                    lost(e);
                }
            }
        });
    }

    // ---------- health and maintenance ----------

    private final Stats statsReader = new Stats();
    private long lastCacheCleanMs, statsAt;
    private String statsCache = "";
    volatile boolean standby;

    /** Current load figures as JSON text (see {@link Stats}); a reading younger than 2 seconds is reused. */
    synchronized String stats() throws IOException {
        if (!connected) throw new IOException("unreachable");
        long now = System.currentTimeMillis();
        if (now - statsAt < 2000 && !statsCache.isEmpty()) return statsCache;
        try {
            if (!statsReader.fresh(now)) {
                statsReader.feed(adb.exec("head -5 /proc/stat"), now);
                Thread.sleep(500);
            }
            statsCache = statsReader.toJson(adb.exec(Stats.COMMAND, 20000), System.currentTimeMillis());
            statsAt = System.currentTimeMillis();
            return statsCache;
        } catch (InterruptedException e) {
            throw new IOException("unreachable");
        } catch (IOException e) {
            lost(e);
            throw new IOException("unreachable");
        }
    }

    /** Empties the apps' caches (never their data) and returns how many MB were freed. */
    synchronized long cleanCache() throws IOException {
        if (!connected) throw new IOException("unreachable");
        long now = System.currentTimeMillis();
        if (now - lastCacheCleanMs < 10000) throw new IOException("too_soon");
        lastCacheCleanMs = now;
        try {
            long before = usedKb();
            adb.exec("pm trim-caches 100G", 60000);
            long after = usedKb();
            return Math.max(0, (before - after) / 1024);
        } catch (IOException e) {
            lost(e);
            throw new IOException("unreachable");
        }
    }

    private long usedKb() throws IOException {
        String[] t = adb.exec("df /data | tail -1").trim().split("\\s+");
        try {
            return t.length > 2 ? Long.parseLong(t[2]) : 0;
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    /** Restarts the TV, but only if it is in standby. Returns "rebooting", "busy" or "unreachable". */
    String rebootIfStandby() {
        boolean was = enabled;
        setEnabled(true);
        boolean rebooting = false;
        try {
            if (!waitConnected(15)) return "unreachable";
            poll();
            if (!standby) return "busy";
            rebooting = true;
            shell("reboot");
            return "rebooting";
        } finally {
            if (!was && !rebooting) setEnabled(false);
        }
    }

    synchronized void sleepTimer(int minutes) {
        if (sleepTask != null) {
            sleepTask.cancel(false);
            sleepTask = null;
        }
        sleepAtMs = 0;
        if (minutes > 0) {
            sleepAtMs = System.currentTimeMillis() + minutes * 60000L;
            sleepTask = sched.schedule(new Runnable() {
                public void run() {
                    sleepAtMs = 0;
                    if (connected && Boolean.TRUE.equals(isOn)) shell("input keyevent 223");
                    changed();
                }
            }, minutes, TimeUnit.MINUTES);
        }
        changed();
    }

    String wake() {
        setEnabled(true);
        if (!waitConnected(10)) return "TV unreachable";
        if (Boolean.FALSE.equals(isOn)) {
            shell("input keyevent 224");
            return "Power on sent";
        }
        return "The TV is already on";
    }

    String powerOff() {
        setEnabled(true);
        if (!waitConnected(8)) return "TV unreachable";
        if (!Boolean.FALSE.equals(isOn)) {
            shell("input keyevent 223");
            return "Power off sent";
        }
        return "The TV is already off";
    }

    String runScene(org.json.JSONObject scene) {
        setEnabled(true);
        if (!waitConnected(8)) return "TV unreachable";
        try {
            if (Boolean.FALSE.equals(isOn)) {
                shell("input keyevent 224");
                Thread.sleep(3000);
            }
            String app = scene.optString("app", "");
            if (!app.isEmpty()) {
                launch(app);
                Thread.sleep(1500);
            }
            if (!scene.isNull("volume")) setVolume(scene.optInt("volume"));
            int timer = scene.optInt("timer", 0);
            if (timer > 0) sleepTimer(timer);
        } catch (InterruptedException ignored) { }
        return "Scene " + scene.optString("name", "") + " started";
    }

    private static String quote(String s) {
        return "'" + s.replace("'", "'\\''") + "'";
    }
}
