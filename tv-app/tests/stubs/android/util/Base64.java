package android.util;

public class Base64 {
    public static final int NO_WRAP = 2, NO_PADDING = 1, URL_SAFE = 8;

    public static String encodeToString(byte[] b, int flags) {
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }
}
