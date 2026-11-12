package app.glassremote.tv;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/** A small QR code generator (byte mode, error correction level M, versions 1 to 6: enough for a web address). */
final class Qr {
    final int size;
    private final boolean[][] modules;
    private final boolean[][] isFunction;
    private final int version;

    // per version 1..6, error correction level M
    private static final int[] ECC_PER_BLOCK = {0, 10, 16, 26, 18, 24, 16};
    private static final int[] NUM_BLOCKS = {0, 1, 1, 1, 2, 2, 4};

    boolean get(int x, int y) { return x >= 0 && y >= 0 && x < size && y < size && modules[y][x]; }

    static Qr encode(String text) {
        byte[] data = text.getBytes(StandardCharsets.UTF_8);
        for (int ver = 1; ver <= 6; ver++) {
            int capacityBits = numDataCodewords(ver) * 8;
            if (4 + 8 + data.length * 8 > capacityBits) continue;
            boolean[] bits = new boolean[capacityBits];
            int[] n = {0};
            append(bits, n, 0x4, 4);
            append(bits, n, data.length, 8);
            for (byte b : data) append(bits, n, b & 0xFF, 8);
            n[0] += Math.min(4, capacityBits - n[0]);
            n[0] = (n[0] + 7) / 8 * 8;
            for (int pad = 0xEC; n[0] < capacityBits; pad ^= 0xEC ^ 0x11) append(bits, n, pad, 8);
            byte[] cw = new byte[capacityBits / 8];
            for (int i = 0; i < capacityBits; i++) if (bits[i]) cw[i >> 3] |= 1 << (7 - (i & 7));
            return new Qr(ver, addEccAndInterleave(cw, ver));
        }
        throw new IllegalArgumentException("text too long for the QR code");
    }

    private static void append(boolean[] bits, int[] n, int value, int len) {
        for (int i = len - 1; i >= 0; i--) bits[n[0]++] = ((value >>> i) & 1) != 0;
    }

    private Qr(int version, byte[] codewords) {
        this.version = version;
        this.size = version * 4 + 17;
        modules = new boolean[size][size];
        isFunction = new boolean[size][size];
        drawFunctionPatterns();
        drawCodewords(codewords);
        int best = 0, bestPenalty = Integer.MAX_VALUE;
        for (int m = 0; m < 8; m++) {
            applyMask(m);
            drawFormatBits(m);
            int p = penalty();
            if (p < bestPenalty) { bestPenalty = p; best = m; }
            applyMask(m);
        }
        applyMask(best);
        drawFormatBits(best);
    }

    // ---------- layout ----------

    private void drawFunctionPatterns() {
        for (int i = 0; i < size; i++) {
            setFunction(6, i, i % 2 == 0);
            setFunction(i, 6, i % 2 == 0);
        }
        finder(3, 3);
        finder(size - 4, 3);
        finder(3, size - 4);
        int[] pos = alignmentPositions();
        int n = pos.length;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if ((i == 0 && j == 0) || (i == 0 && j == n - 1) || (i == n - 1 && j == 0)) continue;
                for (int dy = -2; dy <= 2; dy++)
                    for (int dx = -2; dx <= 2; dx++)
                        setFunction(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) != 1);
            }
        }
        drawFormatBits(0);
    }

    private int[] alignmentPositions() {
        if (version == 1) return new int[0];
        int n = version / 7 + 2;
        int step = (version * 4 + n * 2 + 1) / (n * 2 - 2) * 2;
        int[] r = new int[n];
        r[0] = 6;
        for (int i = n - 1, pos = size - 7; i >= 1; i--, pos -= step) r[i] = pos;
        return r;
    }

    private void finder(int x, int y) {
        for (int dy = -4; dy <= 4; dy++) {
            for (int dx = -4; dx <= 4; dx++) {
                int d = Math.max(Math.abs(dx), Math.abs(dy));
                int xx = x + dx, yy = y + dy;
                if (xx >= 0 && xx < size && yy >= 0 && yy < size) setFunction(xx, yy, d != 2 && d != 4);
            }
        }
    }

    private void setFunction(int x, int y, boolean dark) {
        modules[y][x] = dark;
        isFunction[y][x] = true;
    }

    private void drawFormatBits(int mask) {
        int data = (0 << 3) | mask;      // level M = 0
        int rem = data;
        for (int i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
        int bits = ((data << 10) | rem) ^ 0x5412;
        for (int i = 0; i <= 5; i++) setFunction(8, i, bit(bits, i));
        setFunction(8, 7, bit(bits, 6));
        setFunction(8, 8, bit(bits, 7));
        setFunction(7, 8, bit(bits, 8));
        for (int i = 9; i < 15; i++) setFunction(14 - i, 8, bit(bits, i));
        for (int i = 0; i < 8; i++) setFunction(size - 1 - i, 8, bit(bits, i));
        for (int i = 8; i < 15; i++) setFunction(8, size - 15 + i, bit(bits, i));
        setFunction(8, size - 8, true);
    }

    private static boolean bit(int v, int i) { return ((v >>> i) & 1) != 0; }

    private void drawCodewords(byte[] data) {
        int i = 0;
        for (int right = size - 1; right >= 1; right -= 2) {
            if (right == 6) right = 5;
            for (int vert = 0; vert < size; vert++) {
                for (int j = 0; j < 2; j++) {
                    int x = right - j;
                    boolean upward = ((right + 1) & 2) == 0;
                    int y = upward ? size - 1 - vert : vert;
                    if (!isFunction[y][x] && i < data.length * 8) {
                        modules[y][x] = bit(data[i >>> 3], 7 - (i & 7));
                        i++;
                    }
                }
            }
        }
    }

    private void applyMask(int mask) {
        for (int y = 0; y < size; y++) {
            for (int x = 0; x < size; x++) {
                boolean invert;
                switch (mask) {
                    case 0: invert = (x + y) % 2 == 0; break;
                    case 1: invert = y % 2 == 0; break;
                    case 2: invert = x % 3 == 0; break;
                    case 3: invert = (x + y) % 3 == 0; break;
                    case 4: invert = (x / 3 + y / 2) % 2 == 0; break;
                    case 5: invert = x * y % 2 + x * y % 3 == 0; break;
                    case 6: invert = (x * y % 2 + x * y % 3) % 2 == 0; break;
                    default: invert = ((x + y) % 2 + x * y % 3) % 2 == 0; break;
                }
                if (!isFunction[y][x] && invert) modules[y][x] ^= true;
            }
        }
    }

    /** Simplified penalty: long runs, 2x2 blocks and dark/light balance. Any mask gives a valid code; this picks a readable one. */
    private int penalty() {
        int result = 0;
        for (int pass = 0; pass < 2; pass++) {
            for (int a = 0; a < size; a++) {
                int run = 1;
                for (int b = 1; b < size; b++) {
                    boolean cur = pass == 0 ? modules[a][b] : modules[b][a];
                    boolean prev = pass == 0 ? modules[a][b - 1] : modules[b - 1][a];
                    if (cur == prev) {
                        run++;
                        if (run == 5) result += 3; else if (run > 5) result++;
                    } else {
                        run = 1;
                    }
                }
            }
        }
        for (int y = 0; y < size - 1; y++)
            for (int x = 0; x < size - 1; x++)
                if (modules[y][x] == modules[y][x + 1] && modules[y][x] == modules[y + 1][x] && modules[y][x] == modules[y + 1][x + 1]) result += 3;
        int dark = 0;
        for (boolean[] row : modules) for (boolean m : row) if (m) dark++;
        int total = size * size;
        result += Math.abs(dark * 20 - total * 10) / total * 10;
        return result;
    }

    // ---------- error correction ----------

    private static int rawModules(int ver) {
        int result = (16 * ver + 128) * ver + 64;
        if (ver >= 2) {
            int n = ver / 7 + 2;
            result -= (25 * n - 10) * n - 55;
        }
        return result;
    }

    private static int numDataCodewords(int ver) {
        return rawModules(ver) / 8 - ECC_PER_BLOCK[ver] * NUM_BLOCKS[ver];
    }

    private static byte[] addEccAndInterleave(byte[] data, int ver) {
        int numBlocks = NUM_BLOCKS[ver], eccLen = ECC_PER_BLOCK[ver];
        int raw = rawModules(ver) / 8;
        int numShort = numBlocks - raw % numBlocks;
        int shortLen = raw / numBlocks;
        byte[][] blocks = new byte[numBlocks][];
        byte[] div = rsDivisor(eccLen);
        for (int i = 0, k = 0; i < numBlocks; i++) {
            byte[] dat = Arrays.copyOfRange(data, k, k + shortLen - eccLen + (i < numShort ? 0 : 1));
            k += dat.length;
            byte[] block = Arrays.copyOf(dat, shortLen + 1);
            byte[] ecc = rsRemainder(dat, div);
            System.arraycopy(ecc, 0, block, block.length - eccLen, ecc.length);
            blocks[i] = block;
        }
        byte[] result = new byte[raw];
        for (int i = 0, k = 0; i < blocks[0].length; i++) {
            for (int j = 0; j < blocks.length; j++) {
                if (i != shortLen - eccLen || j >= numShort) result[k++] = blocks[j][i];
            }
        }
        return result;
    }

    private static byte[] rsDivisor(int degree) {
        byte[] r = new byte[degree];
        r[degree - 1] = 1;
        int root = 1;
        for (int i = 0; i < degree; i++) {
            for (int j = 0; j < degree; j++) {
                r[j] = (byte) mul(r[j] & 0xFF, root);
                if (j + 1 < degree) r[j] ^= r[j + 1];
            }
            root = mul(root, 0x02);
        }
        return r;
    }

    private static byte[] rsRemainder(byte[] data, byte[] divisor) {
        byte[] r = new byte[divisor.length];
        for (byte b : data) {
            int factor = (b ^ r[0]) & 0xFF;
            System.arraycopy(r, 1, r, 0, r.length - 1);
            r[r.length - 1] = 0;
            for (int i = 0; i < r.length; i++) r[i] ^= mul(divisor[i] & 0xFF, factor);
        }
        return r;
    }

    private static int mul(int x, int y) {
        int z = 0;
        for (int i = 7; i >= 0; i--) {
            z = (z << 1) ^ ((z >>> 7) * 0x11D);
            z ^= ((y >>> i) & 1) * x;
        }
        return z;
    }
}
