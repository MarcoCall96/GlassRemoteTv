package app.glassremote.tv;

import java.util.Calendar;
import java.util.TimeZone;

/** Plain-Java checks for the restart schedule and the load-figure parser. Run: see tv-app/README.md. Every line must start with PASS. */
public class FeaturesTest {
    private static int failures;

    private static void check(String name, boolean ok) {
        System.out.println((ok ? "PASS " : "FAIL ") + name);
        if (!ok) failures++;
    }

    private static final TimeZone ROME = TimeZone.getTimeZone("Europe/Rome");

    private static long at(int y, int mo, int d, int h, int mi) {
        Calendar c = Calendar.getInstance(ROME);
        c.clear();
        c.set(y, mo - 1, d, h, mi, 0);
        return c.getTimeInMillis();
    }

    private static Schedule.Config cfg(String freq, int day, int hour, int minute) {
        Schedule.Config c = new Schedule.Config();
        c.enabled = true;
        c.freq = freq;
        c.day = day;
        c.hour = hour;
        c.minute = minute;
        return c;
    }

    public static void main(String[] args) {
        // 2026-11-12 is a Thursday
        check("daily, before the time -> same day", Schedule.nextRun(cfg("daily", 1, 4, 0), at(2026, 11, 12, 3, 0), ROME) == at(2026, 11, 12, 4, 0));
        check("daily, after the time -> next day", Schedule.nextRun(cfg("daily", 1, 4, 0), at(2026, 11, 12, 5, 0), ROME) == at(2026, 11, 13, 4, 0));
        check("daily, exactly at the time -> next day", Schedule.nextRun(cfg("daily", 1, 4, 0), at(2026, 11, 12, 4, 0), ROME) == at(2026, 11, 13, 4, 0));
        check("weekly Sunday from Thursday", Schedule.nextRun(cfg("weekly", 7, 4, 0), at(2026, 11, 12, 10, 0), ROME) == at(2026, 11, 15, 4, 0));
        check("weekly Thursday, time already passed -> next Thursday", Schedule.nextRun(cfg("weekly", 4, 4, 0), at(2026, 11, 12, 10, 0), ROME) == at(2026, 11, 19, 4, 0));
        check("weekly Thursday, time still to come -> today", Schedule.nextRun(cfg("weekly", 4, 23, 30), at(2026, 11, 12, 10, 0), ROME) == at(2026, 11, 12, 23, 30));
        check("weekly Monday from Thursday", Schedule.nextRun(cfg("weekly", 1, 3, 15), at(2026, 11, 12, 10, 0), ROME) == at(2026, 11, 16, 3, 15));
        check("monthly day 15 from the 12th", Schedule.nextRun(cfg("monthly", 15, 4, 0), at(2026, 11, 12, 10, 0), ROME) == at(2026, 11, 15, 4, 0));
        check("monthly day 1 from the 12th -> first of next month", Schedule.nextRun(cfg("monthly", 1, 4, 0), at(2026, 11, 12, 10, 0), ROME) == at(2026, 12, 1, 4, 0));
        check("monthly across the new year", Schedule.nextRun(cfg("monthly", 5, 4, 0), at(2026, 12, 20, 10, 0), ROME) == at(2027, 1, 5, 4, 0));
        check("monthly day 28 in February", Schedule.nextRun(cfg("monthly", 28, 4, 0), at(2027, 2, 10, 10, 0), ROME) == at(2027, 2, 28, 4, 0));
        check("daily over the end of daylight saving time", Schedule.nextRun(cfg("daily", 1, 4, 0), at(2026, 10, 24, 6, 0), ROME) == at(2026, 10, 25, 4, 0));
        check("valid weekly", cfg("weekly", 7, 23, 59).valid());
        check("valid monthly 28", cfg("monthly", 28, 0, 0).valid());
        check("invalid frequency", !cfg("yearly", 1, 4, 0).valid());
        check("invalid hour", !cfg("daily", 1, 24, 0).valid());
        check("invalid minute", !cfg("daily", 1, 4, 60).valid());
        check("invalid weekday", !cfg("weekly", 8, 4, 0).valid());
        check("invalid monthly day 29", !cfg("monthly", 29, 4, 0).valid());

        String raw = "cpu  100 0 100 800 0 0 0 0 0 0\ncpu0 25 0 25 200 0 0 0 0 0 0\ncpu1 25 0 25 200 0 0 0 0 0 0\ncpu2 25 0 25 200 0 0 0 0 0 0\ncpu3 25 0 25 200 0 0 0 0 0 0\n"
                + "@@MEM\nMemTotal:        1736896 kB\nMemAvailable:     755364 kB\nCached:           621792 kB\nSwapTotal:        307196 kB\nSwapFree:         116732 kB\n"
                + "@@LOAD\n62.1 61.0 60.5 1/400 1234\n@@UP\n9546.79 32521.80\n@@FREQ\n\n@@TEMP\n\n"
                + "@@FOCUS\n  mCurrentFocus=Window{3fd81cc u0 com.netflix.ninja/com.netflix.Main}\n@@POWER\n  mWakefulness=Awake\n"
                + "@@TOP\nTasks: 352 total\n  Mem: 1.6G total\n400%cpu 100%user\n  PID[%CPU] RES USER        [ARGS]\n 2770 12.5  47M root         zygote\n 5439  0.3 800K u0_a12 com.example.app:remote --flag\n 9999  0.0 1.5G shell top -b -n 1\n"
                + "@@MEMPS\n6111 132608 u0_a76       com.netflix.ninja\n4593 202324 u0_a33       com.google.android.gms\n   PID    RSS USER         NAME\n";
        Stats s = new Stats();
        s.feed("cpu  0 0 0 0 0 0 0 0 0 0\ncpu0 0 0 0 0 0 0 0 0 0 0\ncpu1 0 0 0 0 0 0 0 0 0 0\ncpu2 0 0 0 0 0 0 0 0 0 0\ncpu3 0 0 0 0 0 0 0 0 0 0\n", 1000);
        check("a recent reading is fresh", s.fresh(5000));
        check("an old reading is not fresh", !s.fresh(60000));
        String j = s.toJson(raw, 5000);
        check("json is ok", j.startsWith("{\"ok\":true"));
        check("cpu is 20 percent", j.contains("\"cpu\":20.0"));
        check("four cores", j.contains("\"cores\":[20.0,20.0,20.0,20.0]"));
        check("screen on", j.contains("\"screenOn\":true"));
        check("foreground app", j.contains("\"app\":\"com.netflix.ninja\""));
        check("uptime", j.contains("\"upSec\":9546"));
        check("memory figures", j.contains("\"ramTotMb\":1696") && j.contains("\"ramAvailMb\":737") && j.contains("\"ramUsedMb\":958"));
        check("swap figures", j.contains("\"swapTotMb\":299") && j.contains("\"swapUsedMb\":186"));
        check("no frequency or temperature", j.contains("\"freqMhz\":null") && j.contains("\"tempC\":null"));
        check("load", j.contains("\"load\":[62.1,61.0,60.5]"));
        check("process list parsed", j.contains("\"pid\":2770,\"name\":\"zygote\",\"cpu\":12.5,\"ramMb\":47.0,\"user\":\"root\""));
        check("process with arguments keeps only the name", j.contains("\"name\":\"com.example.app:remote\"") && j.contains("\"ramMb\":0.8"));
        check("the top command itself is hidden", !j.contains("\"pid\":9999"));
        check("memory ranking list", j.contains("\"memProcs\":[{\"pid\":6111,\"name\":\"com.netflix.ninja\",\"ramMb\":129.5,\"user\":\"u0_a76\"},{\"pid\":4593,\"name\":\"com.google.android.gms\",\"ramMb\":197.6")
                && !j.contains("\"name\":\"PID\""));
        check("json quoting", Stats.quote("a\"b\\c\n").equals("\"a\\\"b\\\\c\\u000a\""));
        check("size units", Stats.sizeMb("2G") == 2048 && Stats.sizeMb("512K") == 0.5 && Stats.sizeMb("x") == 0);
        check("web link https accepted", Links.isWebLink("https://www.youtube.com/watch?v=dQw4w9WgXcQ"));
        check("web link http accepted", Links.isWebLink("http://example.org/a?b=c#d"));
        check("short youtube link accepted", Links.isWebLink("https://youtu.be/dQw4w9WgXcQ"));
        check("file scheme refused", !Links.isWebLink("file:///data/data/x"));
        check("content scheme refused", !Links.isWebLink("content://com.x/y"));
        check("intent scheme refused", !Links.isWebLink("intent://x#Intent;scheme=a;end"));
        check("market scheme refused", !Links.isWebLink("market://details?id=a.b"));
        check("javascript scheme refused", !Links.isWebLink("javascript:alert(1)"));
        check("link without host refused", !Links.isWebLink("https:///path"));
        check("link with space refused", !Links.isWebLink("https://a.b/c d"));
        check("link with newline refused", !Links.isWebLink("https://a.b/c\nd"));
        check("empty link refused", !Links.isWebLink("") && !Links.isWebLink(null));
        check("package name accepted", Links.isPackageName("com.netflix.ninja") && Links.isPackageName("app.glassremote.tv"));
        check("package name with option refused", !Links.isPackageName("-p x") && !Links.isPackageName("a.b; reboot") && !Links.isPackageName("a..b"));
        System.exit(failures == 0 ? 0 : 1);
    }
}
