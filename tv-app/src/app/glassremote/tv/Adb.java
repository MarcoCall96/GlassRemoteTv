package app.glassremote.tv;

import android.util.Base64;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.math.BigInteger;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.nio.charset.StandardCharsets;
import java.security.Signature;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/** A minimal ADB client (the protocol behind "adb shell"), used to talk to this TV's own debug service. */
final class Adb {
    static final int CNXN = 0x4e584e43, AUTH = 0x48545541, OPEN = 0x4e45504f, OKAY = 0x59414b4f, CLSE = 0x45534c43, WRTE = 0x45545257;

    /** Thrown when the TV needs the user to tap "Allow" on screen. */
    static final class NeedsAuthorization extends IOException {
        NeedsAuthorization() { super("authorization needed"); }
    }

    interface Prompt { void waiting(); }

    private final Identity id;
    private Socket sock;
    private InputStream in;
    private OutputStream out;
    private int nextId = 1;

    Adb(Identity id) { this.id = id; }

    boolean isOpen() { return sock != null && !sock.isClosed(); }

    /** Connects and authenticates. If the TV does not know our key yet, it shows "Allow USB debugging?" and we wait for it. */
    synchronized void connect(String host, int port, Prompt prompt, int authWaitMs) throws IOException {
        close();
        Socket s = new Socket();
        s.connect(new InetSocketAddress(host, port), 3000);
        s.setTcpNoDelay(true);
        sock = s;
        in = s.getInputStream();
        out = s.getOutputStream();
        s.setSoTimeout(5000);
        send(CNXN, 0x01000001, 256 * 1024, "host::\0".getBytes(StandardCharsets.ISO_8859_1));
        boolean signed = false, keySent = false;
        for (int i = 0; i < 6; i++) {
            Pkt p = read();
            if (p.cmd == CNXN) {
                s.setSoTimeout(8000);
                return;
            }
            if (p.cmd != AUTH || p.arg0 != 1) continue;
            if (!signed) {
                signed = true;
                send(AUTH, 2, 0, sign(p.data));
            } else if (!keySent) {
                keySent = true;
                send(AUTH, 3, 0, publicKeyBlob());
                if (prompt != null) prompt.waiting();
                s.setSoTimeout(authWaitMs);
            } else {
                throw new NeedsAuthorization();
            }
        }
        throw new NeedsAuthorization();
    }

    synchronized void close() {
        if (sock != null) try { sock.close(); } catch (IOException ignored) { }
        sock = null;
    }

    /** Runs a shell command on the TV and returns what it printed. */
    synchronized String exec(String cmd) throws IOException { return exec(cmd, 0); }

    /** Same, allowing a longer wait for slow commands (0 keeps the normal limit). */
    synchronized String exec(String cmd, int timeoutMs) throws IOException {
        if (!isOpen()) throw new IOException("not connected");
        int local = nextId++;
        try {
            if (timeoutMs > 0) sock.setSoTimeout(timeoutMs);
            send(OPEN, local, 0, ("shell:" + cmd + "\0").getBytes(StandardCharsets.UTF_8));
            ByteArrayOutputStream result = new ByteArrayOutputStream();
            int remote = 0;
            while (true) {
                Pkt p = read();
                if (p.cmd == OKAY && p.arg1 == local) {
                    remote = p.arg0;
                } else if (p.cmd == WRTE && p.arg1 == local) {
                    result.write(p.data, 0, p.data.length);
                    send(OKAY, local, p.arg0, new byte[0]);
                } else if (p.cmd == CLSE && p.arg1 == local) {
                    if (remote != 0) send(CLSE, local, remote, new byte[0]);
                    break;
                }
            }
            return new String(result.toByteArray(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            close();
            throw e;
        } finally {
            if (timeoutMs > 0 && sock != null) try { sock.setSoTimeout(8000); } catch (IOException ignored) { }
        }
    }

    // ---------- long-lived stream ----------

    /** A shell command that keeps running while we keep writing to its input. It stops when this connection closes. */
    final class Stream {
        private final int local;
        private volatile int remote;
        private volatile boolean closed;
        private final Semaphore window = new Semaphore(0);
        private final StringBuilder output = new StringBuilder();

        private Stream(int local) { this.local = local; }

        boolean isClosed() { return closed; }

        String output() {
            synchronized (output) { return output.toString(); }
        }

        void write(byte[] data) throws IOException {
            if (closed) throw new IOException("closed");
            try {
                if (!window.tryAcquire(1500, TimeUnit.MILLISECONDS)) throw new IOException("stream stalled");
            } catch (InterruptedException e) {
                throw new IOException("interrupted");
            }
            send(WRTE, local, remote, data);
        }

        void close() {
            closed = true;
            Adb.this.close();
        }
    }

    /** Opens a shell command on a connection that is used for nothing else (it reads on its own thread). */
    synchronized Stream openStream(String cmd) throws IOException {
        if (!isOpen()) throw new IOException("not connected");
        final int local = nextId++;
        final Stream st = new Stream(local);
        sock.setSoTimeout(0);
        send(OPEN, local, 0, ("shell:" + cmd + "\0").getBytes(StandardCharsets.UTF_8));
        Pkt first = read();
        if (first.cmd != OKAY || first.arg1 != local) throw new IOException("could not open the shell");
        st.remote = first.arg0;
        st.window.release();
        Thread t = new Thread(new Runnable() {
            public void run() {
                try {
                    while (!st.closed) {
                        Pkt p = read();
                        if (p.arg1 != local) continue;
                        if (p.cmd == OKAY) {
                            st.window.release();
                        } else if (p.cmd == WRTE) {
                            synchronized (st.output) {
                                if (st.output.length() < 2048) st.output.append(new String(p.data, StandardCharsets.UTF_8));
                            }
                            send(OKAY, local, p.arg0, new byte[0]);
                        } else if (p.cmd == CLSE) {
                            break;
                        }
                    }
                } catch (IOException ignored) {
                } finally {
                    st.closed = true;
                    Adb.this.close();
                }
            }
        }, "adb-stream");
        t.setDaemon(true);
        t.start();
        return st;
    }

    // ---------- packets ----------

    private static final class Pkt {
        int cmd, arg0, arg1;
        byte[] data;
    }

    private final Object writeLock = new Object();

    private void send(int cmd, int a0, int a1, byte[] data) throws IOException {
        int sum = 0;
        for (byte b : data) sum += b & 0xFF;
        byte[] h = new byte[24];
        put(h, 0, cmd);
        put(h, 4, a0);
        put(h, 8, a1);
        put(h, 12, data.length);
        put(h, 16, sum);
        put(h, 20, cmd ^ 0xFFFFFFFF);
        synchronized (writeLock) {
            out.write(h);
            if (data.length > 0) out.write(data);
            out.flush();
        }
    }

    private Pkt read() throws IOException {
        byte[] h = new byte[24];
        readFully(h);
        Pkt p = new Pkt();
        p.cmd = get(h, 0);
        p.arg0 = get(h, 4);
        p.arg1 = get(h, 8);
        int len = get(h, 12);
        if (len < 0 || len > 1 << 20) throw new IOException("bad packet length");
        p.data = new byte[len];
        if (len > 0) readFully(p.data);
        return p;
    }

    private void readFully(byte[] b) throws IOException {
        int off = 0;
        while (off < b.length) {
            int n;
            try {
                n = in.read(b, off, b.length - off);
            } catch (SocketTimeoutException e) {
                throw new IOException("timeout");
            }
            if (n < 0) throw new IOException("closed");
            off += n;
        }
    }

    private static void put(byte[] b, int o, int v) {
        b[o] = (byte) v;
        b[o + 1] = (byte) (v >> 8);
        b[o + 2] = (byte) (v >> 16);
        b[o + 3] = (byte) (v >> 24);
    }

    private static int get(byte[] b, int o) {
        return (b[o] & 0xFF) | ((b[o + 1] & 0xFF) << 8) | ((b[o + 2] & 0xFF) << 16) | ((b[o + 3] & 0xFF) << 24);
    }

    // ---------- authentication ----------

    /** ADB signs the 20-byte token as if it were a SHA-1 digest. */
    private byte[] sign(byte[] token) throws IOException {
        try {
            byte[] prefix = {0x30, 0x21, 0x30, 0x09, 0x06, 0x05, 0x2b, 0x0e, 0x03, 0x02, 0x1a, 0x05, 0x00, 0x04, 0x14};
            Signature s = Signature.getInstance("NONEwithRSA");
            s.initSign(id.key);
            s.update(prefix);
            s.update(token);
            return s.sign();
        } catch (Exception e) {
            throw new IOException("signing failed: " + e);
        }
    }

    /** The public key in the format adbd expects (Android "RSAPublicKey" struct), base64 plus a label. */
    private byte[] publicKeyBlob() {
        BigInteger n = id.pub.getModulus();
        BigInteger two32 = BigInteger.ONE.shiftLeft(32);
        long n0inv = two32.subtract(n.mod(two32).modInverse(two32)).longValue() & 0xFFFFFFFFL;
        BigInteger rr = BigInteger.ONE.shiftLeft(4096).mod(n);
        byte[] blob = new byte[4 + 4 + 256 + 256 + 4];
        put(blob, 0, 64);
        put(blob, 4, (int) n0inv);
        littleEndian(n, blob, 8, 256);
        littleEndian(rr, blob, 264, 256);
        put(blob, 520, id.pub.getPublicExponent().intValue());
        String text = Base64.encodeToString(blob, Base64.NO_WRAP) + " glassremote@tv\0";
        return text.getBytes(StandardCharsets.ISO_8859_1);
    }

    private static void littleEndian(BigInteger v, byte[] dst, int off, int len) {
        byte[] be = v.toByteArray();
        for (int i = 0; i < len; i++) {
            int src = be.length - 1 - i;
            dst[off + i] = src >= 0 ? be[src] : 0;
        }
    }
}
