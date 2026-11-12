package app.glassremote.tv;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;

/**
 * The RSA key this app uses to introduce itself to the TV's debug service. The TV asks you once to allow it
 * ("Allow USB debugging?", tick "Always allow") and remembers it. The key stays in the app's private storage.
 */
final class Identity {
    final PrivateKey key;
    final RSAPublicKey pub;

    private Identity(PrivateKey key, RSAPublicKey pub) {
        this.key = key;
        this.pub = pub;
    }

    static Identity loadOrCreate(File dir) throws Exception {
        File kf = new File(dir, "adb-key.der");
        File pf = new File(dir, "adb-pub.der");
        if (kf.exists() && pf.exists()) {
            try {
                KeyFactory f = KeyFactory.getInstance("RSA");
                return new Identity(f.generatePrivate(new PKCS8EncodedKeySpec(read(kf))), (RSAPublicKey) f.generatePublic(new X509EncodedKeySpec(read(pf))));
            } catch (Exception ignored) {
                // damaged files: create a new key (the TV will ask to allow it again)
            }
        }
        KeyPairGenerator g = KeyPairGenerator.getInstance("RSA");
        g.initialize(2048);
        KeyPair kp = g.generateKeyPair();
        write(kf, kp.getPrivate().getEncoded());
        write(pf, kp.getPublic().getEncoded());
        return new Identity(kp.getPrivate(), (RSAPublicKey) kp.getPublic());
    }

    private static byte[] read(File f) throws Exception {
        try (FileInputStream in = new FileInputStream(f)) {
            ByteArrayOutputStream o = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            int n;
            while ((n = in.read(buf)) > 0) o.write(buf, 0, n);
            return o.toByteArray();
        }
    }

    private static void write(File f, byte[] d) throws Exception {
        try (FileOutputStream o = new FileOutputStream(f)) {
            o.write(d);
        }
    }
}
