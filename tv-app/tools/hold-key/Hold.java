import android.os.SystemClock;
import android.view.InputDevice;
import android.view.InputEvent;
import android.view.KeyEvent;

import java.lang.reflect.Method;

/** Holds a key down for a while (temporary helper for the one-time Home screen setup). */
public class Hold {
    public static void main(String[] a) throws Exception {
        int key = Integer.parseInt(a[0]);
        long ms = Long.parseLong(a[1]);
        Class<?> im = Class.forName("android.hardware.input.InputManager");
        Object mgr = im.getMethod("getInstance").invoke(null);
        Method inj = im.getMethod("injectInputEvent", InputEvent.class, int.class);
        long down = SystemClock.uptimeMillis();
        send(mgr, inj, new KeyEvent(down, down, KeyEvent.ACTION_DOWN, key, 0, 0, -1, 0, 0, InputDevice.SOURCE_KEYBOARD));
        int n = 1;
        while (SystemClock.uptimeMillis() - down < ms) {
            Thread.sleep(80);
            long now = SystemClock.uptimeMillis();
            send(mgr, inj, new KeyEvent(down, now, KeyEvent.ACTION_DOWN, key, n++, 0, -1, 0, 0, InputDevice.SOURCE_KEYBOARD));
        }
        long up = SystemClock.uptimeMillis();
        send(mgr, inj, new KeyEvent(down, up, KeyEvent.ACTION_UP, key, 0, 0, -1, 0, 0, InputDevice.SOURCE_KEYBOARD));
    }

    private static void send(Object mgr, Method inj, KeyEvent e) throws Exception {
        inj.invoke(mgr, e, 0);
    }
}
