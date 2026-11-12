package app.glassremote.tv;

import android.content.Context;
import java.io.File;

public class AuthTest {
    static int failures = 0;

    static void check(String name, boolean cond) {
        if (!cond) failures++;
        System.out.println((cond ? "PASS " : "FAIL ") + name);
    }

    public static void main(String[] a) throws Exception {
        File dir = java.nio.file.Files.createTempDirectory("auth").toFile();
        Auth auth = new Auth(new Context(dir));
        String pin = auth.pin();
        check("pin has 6 digits", pin.matches("\\d{6}"));
        int port = auth.port();
        check("port in range", port >= 20000 && port <= 59999);
        check("port persisted", new Auth(new Context(dir)).port() == port);
        check("pin persisted", new Auth(new Context(dir)).pin().equals(pin));
        String wrong = pin.equals("000000") ? "111111" : "000000";

        for (int i = 0; i < 4; i++) check("wrong pin #" + (i + 1) + " -> null", auth.login(wrong, "10.0.0.5") == null);
        check("5th wrong pin -> null (starts lock)", auth.login(wrong, "10.0.0.5") == null);
        check("locked peer is refused even with the right pin", "locked".equals(auth.login(pin, "10.0.0.5")));
        String token = auth.login(pin, "10.0.0.9");
        check("another address can still log in", token != null && !token.equals("locked"));
        check("token is valid", auth.valid(token));
        check("random token is not valid", !auth.valid("abc"));
        check("empty token is not valid", !auth.valid("") && !auth.valid(null));
        check("token persisted across restarts", new Auth(new Context(dir)).valid(token));

        String before = auth.pin();
        for (int i = 0; i < 40; i++) auth.login("x" + i, "10.1.0." + i);
        check("pin rotated after repeated wrong tries", !auth.pin().equals(before));
        check("old token still valid after rotation", auth.valid(token));
        check("old pin no longer works", auth.login(before, "10.2.0.1") == null);

        int p2 = auth.newPort();
        check("newPort in range and persisted", p2 >= 20000 && p2 <= 59999 && new Auth(new Context(dir)).port() == p2);
        System.exit(failures == 0 ? 0 : 1);
    }
}
