package app.glassremote.tv;

import android.content.Context;
import android.util.Base64;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * The PIN shown on the TV and the port this TV listens on. A phone types the PIN once (or scans the QR code)
 * and receives a long random token that it keeps; only requests carrying a known token can control the TV.
 * Wrong guesses are rate limited per address, and the PIN changes by itself after too many wrong guesses.
 */
final class Auth {
    private static final int MAX_TOKENS = 30;
    private static final int MAX_FAILS = 5;
    private static final long BASE_LOCK_MS = 60_000;
    private static final long MAX_LOCK_MS = 15 * 60_000;
    private static final int ROTATE_AFTER_FAILS = 30;
    private static final int MAX_TRACKED_PEERS = 256;

    private static final class Peer {
        int fails;
        int cycles;
        long lockedUntil;
    }

    private final File pinFile, tokenFile, portFile;
    private final SecureRandom rnd = new SecureRandom();
    private final List<String> tokens = new ArrayList<>();
    private final Map<String, Peer> peers = new HashMap<>();
    private String pin;
    private int totalFails;
    private int port;

    Auth(Context ctx) {
        pinFile = new File(ctx.getFilesDir(), "pin.txt");
        tokenFile = new File(ctx.getFilesDir(), "tokens.txt");
        portFile = new File(ctx.getFilesDir(), "port.txt");
        pin = read(pinFile).trim();
        if (!pin.matches("\\d{6}")) newPin();
        for (String t : read(tokenFile).split("\n")) if (!t.trim().isEmpty()) tokens.add(t.trim());
        String p = read(portFile).trim();
        port = p.matches("\\d{4,5}") ? Integer.parseInt(p) : 0;
        if (port < 20000 || port > 59999) newPort();
    }

    synchronized String pin() { return pin; }

    synchronized int port() { return port; }

    /** Picks another random port (used when the saved one is taken). */
    synchronized int newPort() {
        port = 20000 + rnd.nextInt(40000);
        write(portFile, String.valueOf(port));
        return port;
    }

    private void newPin() {
        pin = String.format("%06d", rnd.nextInt(1_000_000));
        write(pinFile, pin);
    }

    synchronized boolean valid(String token) {
        if (token == null || token.isEmpty()) return false;
        boolean ok = false;
        byte[] a = token.getBytes(StandardCharsets.UTF_8);
        for (String t : tokens) ok |= MessageDigest.isEqual(a, t.getBytes(StandardCharsets.UTF_8));
        return ok;
    }

    /**
     * Returns a new token for the right PIN, "locked" while this address is rate limited, or null for a wrong PIN.
     * The lock is kept per address so one device cannot stop the others, and it grows with every locked round.
     */
    synchronized String login(String attempt, String from) {
        long now = System.currentTimeMillis();
        if (peers.size() > MAX_TRACKED_PEERS) peers.clear();
        Peer p = peers.get(from);
        if (p == null) {
            p = new Peer();
            peers.put(from, p);
        }
        if (now < p.lockedUntil) return "locked";
        boolean ok = attempt != null && MessageDigest.isEqual(attempt.trim().getBytes(StandardCharsets.UTF_8), pin.getBytes(StandardCharsets.UTF_8));
        if (!ok) {
            if (++p.fails >= MAX_FAILS) {
                p.fails = 0;
                p.cycles++;
                p.lockedUntil = now + Math.min(MAX_LOCK_MS, BASE_LOCK_MS << Math.min(p.cycles - 1, 4));
            }
            if (++totalFails >= ROTATE_AFTER_FAILS) {
                totalFails = 0;
                newPin();
            }
            return null;
        }
        totalFails = 0;
        peers.remove(from);
        byte[] b = new byte[24];
        rnd.nextBytes(b);
        String token = Base64.encodeToString(b, Base64.URL_SAFE | Base64.NO_PADDING | Base64.NO_WRAP);
        tokens.add(token);
        while (tokens.size() > MAX_TOKENS) tokens.remove(0);
        write(tokenFile, join(tokens));
        return token;
    }

    private static String join(List<String> l) {
        StringBuilder sb = new StringBuilder();
        for (String s : l) sb.append(s).append('\n');
        return sb.toString();
    }

    private static String read(File f) {
        if (!f.exists()) return "";
        try (FileInputStream in = new FileInputStream(f)) {
            byte[] b = new byte[(int) f.length()];
            int off = 0;
            while (off < b.length) {
                int r = in.read(b, off, b.length - off);
                if (r < 0) break;
                off += r;
            }
            return new String(b, 0, off, StandardCharsets.UTF_8);
        } catch (IOException e) {
            return "";
        }
    }

    private static void write(File f, String s) {
        try (FileOutputStream out = new FileOutputStream(f)) {
            out.write(s.getBytes(StandardCharsets.UTF_8));
        } catch (IOException ignored) { }
    }
}
