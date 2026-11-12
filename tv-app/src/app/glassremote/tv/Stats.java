package app.glassremote.tv;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Reads the TV's load figures (CPU, memory, processes) out of the text printed by {@link #COMMAND} and turns them into JSON. */
final class Stats {
    static final String COMMAND = "head -5 /proc/stat; echo @@MEM; grep -E 'MemTotal|MemAvailable|SwapTotal|SwapFree|^Cached' /proc/meminfo;"
            + " echo @@LOAD; cat /proc/loadavg; echo @@UP; cat /proc/uptime;"
            + " echo @@FREQ; cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq 2>/dev/null;"
            + " echo @@TEMP; cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null;"
            + " echo @@FOCUS; dumpsys window 2>/dev/null | grep -m1 mCurrentFocus;"
            + " echo @@POWER; dumpsys power 2>/dev/null | grep -m1 mWakefulness=;"
            + " echo @@TOP; top -b -n 1 -m 40 -s 2 -o PID,%CPU,RES,USER,ARGS;"
            + " echo @@MEMPS; ps -A -o PID,RSS,USER,NAME | sort -k2 -n -r | head -30";

    private static final Pattern FOCUS = Pattern.compile("\\s([\\w.]+)/\\S+\\}");
    private static final int MAX_PROCS = 40;

    private long[][] prev;
    private long prevAt;

    /** True when a previous reading is recent enough to compute CPU use from the counters. */
    synchronized boolean fresh(long nowMs) { return prev != null && nowMs - prevAt < 20000; }

    synchronized void feed(String statText, long nowMs) {
        long[][] c = counters(statText);
        if (c.length > 0) {
            prev = c;
            prevAt = nowMs;
        }
    }

    private static long[][] counters(String text) {
        List<long[]> rows = new ArrayList<>();
        for (String line : text.split("\n")) {
            if (!line.startsWith("cpu")) continue;
            String[] v = line.trim().split("\\s+");
            long total = 0, idle = 0;
            for (int i = 1; i < v.length && i <= 8; i++) {
                long n = parseLong(v[i]);
                total += n;
                if (i == 4 || i == 5) idle += n;
            }
            rows.add(new long[] { total, idle });
        }
        return rows.toArray(new long[0][]);
    }

    private static long parseLong(String s) {
        try { return Long.parseLong(s); } catch (NumberFormatException e) { return 0; }
    }

    synchronized String toJson(String raw, long nowMs) {
        String[] parts = raw.split("(?m)^@@(\\w+)\\s*$");
        Matcher tags = Pattern.compile("(?m)^@@(\\w+)\\s*$").matcher(raw);
        java.util.Map<String, String> sec = new java.util.HashMap<>();
        sec.put("STAT", parts.length > 0 ? parts[0] : "");
        int i = 1;
        while (tags.find() && i < parts.length) sec.put(tags.group(1), parts[i++].trim());

        long[][] now = counters(sec.get("STAT"));
        double[] use = new double[now.length];
        if (prev != null) {
            for (int k = 0; k < now.length && k < prev.length; k++) {
                long dt = now[k][0] - prev[k][0], di = now[k][1] - prev[k][1];
                use[k] = dt > 0 ? Math.max(0, Math.min(100, 100.0 * (1 - (double) di / dt))) : 0;
            }
        }
        prev = now;
        prevAt = nowMs;

        long memTotal = 0, memAvail = 0, swapTotal = 0, swapFree = 0, cached = 0;
        for (String line : nz(sec.get("MEM")).split("\n")) {
            String[] kv = line.split(":");
            if (kv.length < 2) continue;
            long v = parseLong(kv[1].trim().split("\\s+")[0]);
            switch (kv[0].trim()) {
                case "MemTotal": memTotal = v; break;
                case "MemAvailable": memAvail = v; break;
                case "SwapTotal": swapTotal = v; break;
                case "SwapFree": swapFree = v; break;
                case "Cached": cached = v; break;
                default: break;
            }
        }

        StringBuilder sb = new StringBuilder("{\"ok\":true");
        Matcher f = FOCUS.matcher(nz(sec.get("FOCUS")));
        sb.append(",\"screenOn\":").append(nz(sec.get("POWER")).contains("Awake"));
        sb.append(",\"app\":").append(quote(f.find() ? f.group(1) : ""));
        sb.append(",\"upSec\":").append((long) parseDouble(nz(sec.get("UP")).split("\\s+")[0]));
        sb.append(",\"cpu\":").append(num(use.length > 0 ? use[0] : 0));
        sb.append(",\"cores\":[");
        for (int k = 1; k < use.length; k++) sb.append(k > 1 ? "," : "").append(num(use[k]));
        sb.append(']');
        long freq = (long) parseDouble(nz(sec.get("FREQ")));
        sb.append(",\"freqMhz\":").append(freq > 0 ? String.valueOf(freq / 1000) : "null");
        long temp = (long) parseDouble(nz(sec.get("TEMP")));
        sb.append(",\"tempC\":").append(temp > 1000 ? num(temp / 1000.0) : temp > 0 ? String.valueOf(temp) : "null");
        sb.append(",\"load\":[");
        String[] la = nz(sec.get("LOAD")).split("\\s+");
        for (int k = 0; k < 3 && k < la.length; k++) sb.append(k > 0 ? "," : "").append(num(parseDouble(la[k])));
        sb.append(']');
        sb.append(",\"ramTotMb\":").append(memTotal / 1024);
        sb.append(",\"ramUsedMb\":").append(Math.max(0, memTotal - memAvail) / 1024);
        sb.append(",\"ramAvailMb\":").append(memAvail / 1024);
        sb.append(",\"cacheMb\":").append(cached / 1024);
        sb.append(",\"swapTotMb\":").append(swapTotal / 1024);
        sb.append(",\"swapUsedMb\":").append(Math.max(0, swapTotal - swapFree) / 1024);
        sb.append(",\"procs\":[");
        boolean inTable = false, first = true;
        int count = 0;
        for (String line : nz(sec.get("TOP")).split("\n")) {
            String[] t = line.trim().split("\\s+", 5);
            if (!inTable) {
                if (t.length > 0 && t[0].startsWith("PID")) inTable = true;
                continue;
            }
            if (t.length < 5 || !t[0].matches("\\d+") || count >= MAX_PROCS) continue;
            String name = t[4].trim().split(" ")[0];
            if (name.equals("top") || name.equals("sh") || name.equals("grep") || name.equals("head") || name.equals("cat")) continue;
            if (!first) sb.append(',');
            first = false;
            count++;
            sb.append("{\"pid\":").append(t[0]).append(",\"name\":").append(quote(name)).append(",\"cpu\":").append(num(parseDouble(t[1])))
                    .append(",\"ramMb\":").append(num(sizeMb(t[2]))).append(",\"user\":").append(quote(t[3])).append('}');
        }
        sb.append("],\"memProcs\":[");
        first = true;
        count = 0;
        for (String line : nz(sec.get("MEMPS")).split("\n")) {
            String[] t = line.trim().split("\\s+", 4);
            if (t.length < 4 || !t[0].matches("\\d+") || !t[1].matches("\\d+") || count >= MAX_PROCS) continue;
            String name = t[3].trim().split(" ")[0];
            if (name.equals("ps") || name.equals("sort") || name.equals("head") || name.equals("sh")) continue;
            if (!first) sb.append(',');
            first = false;
            count++;
            sb.append("{\"pid\":").append(t[0]).append(",\"name\":").append(quote(name)).append(",\"ramMb\":").append(num(parseLong(t[1]) / 1024.0))
                    .append(",\"user\":").append(quote(t[2])).append('}');
        }
        return sb.append("]}").toString();
    }

    private static String nz(String s) { return s == null ? "" : s; }

    private static double parseDouble(String s) {
        try { return Double.parseDouble(s.trim()); } catch (NumberFormatException e) { return 0; }
    }

    /** "47M", "800K", "1.2G" or a plain number of bytes, in MB. */
    static double sizeMb(String s) {
        Matcher m = Pattern.compile("^([\\d.]+)([KMGT]?)$").matcher(s);
        if (!m.matches()) return 0;
        double n = parseDouble(m.group(1));
        switch (m.group(2)) {
            case "K": return n / 1024;
            case "M": return n;
            case "G": return n * 1024;
            case "T": return n * 1024 * 1024;
            default: return n / (1024 * 1024);
        }
    }

    private static String num(double d) { return String.format(Locale.US, "%.1f", d); }

    static String quote(String s) {
        StringBuilder b = new StringBuilder("\"");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '"' || c == '\\') b.append('\\').append(c);
            else if (c < 0x20) b.append(String.format("\\u%04x", (int) c));
            else b.append(c);
        }
        return b.append('"').toString();
    }
}
