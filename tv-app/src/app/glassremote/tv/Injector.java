package app.glassremote.tv;

import android.os.SystemClock;
import android.view.InputDevice;
import android.view.InputEvent;
import android.view.KeyEvent;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;

/**
 * Tiny key injector. TvLink starts it through the debug service ("app_process" as the shell user, class taken from this
 * same APK) on a dedicated debug connection and writes key codes to its standard input. A key press then costs a few
 * milliseconds instead of the ~0.8 s that "input keyevent" needs to start a new Java process every time.
 * It has no network socket of its own and exits as soon as that debug connection closes.
 * Protocol (one line each): "K code [code...]" taps the keys; it prints "READY" once it can inject.
 */
public final class Injector {
    private static final int MAX_KEYS_PER_LINE = 16;

    private static Object manager;
    private static Method inject;

    public static void main(String[] args) throws Exception {
        Class<?> im = Class.forName("android.hardware.input.InputManager");
        manager = im.getMethod("getInstance").invoke(null);
        inject = im.getMethod("injectInputEvent", InputEvent.class, int.class);
        System.out.println("READY");
        System.out.flush();
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.US_ASCII), 512);
        String line;
        while ((line = in.readLine()) != null) {
            if (!line.startsWith("K ")) continue;
            String[] p = line.substring(2).trim().split(" ");
            for (int i = 0; i < p.length && i < MAX_KEYS_PER_LINE; i++) {
                try {
                    int code = Integer.parseInt(p[i]);
                    if (code > 0 && code < 400) tap(code);
                } catch (Exception ignored) { }
            }
        }
    }

    private static void tap(int code) throws Exception {
        long now = SystemClock.uptimeMillis();
        inject.invoke(manager, new KeyEvent(now, now, KeyEvent.ACTION_DOWN, code, 0, 0, -1, 0, 0, InputDevice.SOURCE_KEYBOARD), 0);
        inject.invoke(manager, new KeyEvent(now, now, KeyEvent.ACTION_UP, code, 0, 0, -1, 0, 0, InputDevice.SOURCE_KEYBOARD), 0);
    }
}
