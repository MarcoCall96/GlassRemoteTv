package app.glassremote.tv;

import java.net.URI;

/** Which strings the "open on the TV" feature accepts (plain Java, covered by tests). */
final class Links {
    private Links() { }

    /** Only ordinary web links with a host: no file:, content:, intent:, market: or other app-internal schemes. */
    static boolean isWebLink(String s) {
        if (s == null || s.length() > 1024) return false;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c <= 0x20 || c == 0x7f) return false;
        }
        try {
            URI u = new URI(s);
            String scheme = u.getScheme();
            return scheme != null && (scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))
                    && u.getHost() != null && !u.getHost().isEmpty();
        } catch (java.net.URISyntaxException e) {
            return false;
        }
    }

    /** An Android package name such as "com.netflix.ninja". */
    static boolean isPackageName(String s) {
        return s != null && s.length() <= 256 && s.matches("[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z][A-Za-z0-9_]*)*");
    }
}
