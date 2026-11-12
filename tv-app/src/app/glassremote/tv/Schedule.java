package app.glassremote.tv;

import java.util.Calendar;
import java.util.TimeZone;

/** The restart schedule: when it is allowed and how to compute the next moment (plain Java, covered by tests). */
final class Schedule {
    private Schedule() { }

    static final class Config {
        boolean enabled;
        String freq = "weekly";
        int day = 7, hour = 4, minute = 0;

        /** Day is the ISO weekday (1 = Monday .. 7 = Sunday) for "weekly" and the day of the month (1..28) for "monthly". */
        boolean valid() {
            if (!freq.equals("daily") && !freq.equals("weekly") && !freq.equals("monthly")) return false;
            if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return false;
            if (freq.equals("weekly")) return day >= 1 && day <= 7;
            if (freq.equals("monthly")) return day >= 1 && day <= 28;
            return true;
        }
    }

    /** The first moment strictly after {@code afterMs} that matches the schedule, in the given time zone. */
    static long nextRun(Config c, long afterMs, TimeZone tz) {
        Calendar cal = Calendar.getInstance(tz);
        cal.setTimeInMillis(afterMs);
        cal.set(Calendar.HOUR_OF_DAY, c.hour);
        cal.set(Calendar.MINUTE, c.minute);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        if (c.freq.equals("monthly")) {
            cal.set(Calendar.DAY_OF_MONTH, c.day);
            if (cal.getTimeInMillis() <= afterMs) {
                cal.set(Calendar.DAY_OF_MONTH, 1);
                cal.add(Calendar.MONTH, 1);
                cal.set(Calendar.DAY_OF_MONTH, c.day);
            }
            return cal.getTimeInMillis();
        }
        for (int i = 0; i < 9; i++) {
            boolean dayOk = c.freq.equals("daily") || isoWeekday(cal) == c.day;
            if (dayOk && cal.getTimeInMillis() > afterMs) break;
            cal.add(Calendar.DAY_OF_MONTH, 1);
        }
        return cal.getTimeInMillis();
    }

    private static int isoWeekday(Calendar cal) { return (cal.get(Calendar.DAY_OF_WEEK) + 5) % 7 + 1; }
}
