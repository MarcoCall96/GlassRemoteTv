package app.glassremote.tv;

import android.app.Activity;
import android.content.Intent;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.TextView;

/** The screen you see on the TV: the address to open on your phone and the current status. */
public class MainActivity extends Activity {
    private final Handler handler = new Handler();
    private TextView url, status, hint, pin;
    private QrView qr;
    private String qrText = "";

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.HORIZONTAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(Color.rgb(6, 7, 12));
        root.setPadding(80, 40, 80, 40);

        qr = new QrView(this);
        LinearLayout.LayoutParams qlp = new LinearLayout.LayoutParams(460, 460);
        qlp.rightMargin = 70;
        root.addView(qr, qlp);

        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setGravity(Gravity.CENTER_VERTICAL);
        root.addView(col, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        TextView title = text("GlassRemoteTv", 48, Color.rgb(245, 247, 251), true);
        TextView sub = text("Scan the code with your phone camera (same Wi-Fi), or open:", 24, Color.rgb(170, 178, 195), false);
        url = text("…", 44, Color.rgb(98, 200, 255), true);
        pin = text("", 30, Color.rgb(245, 247, 251), true);
        status = text("", 28, Color.rgb(245, 247, 251), false);
        hint = text("", 22, Color.rgb(150, 158, 178), false);
        for (TextView t : new TextView[] {title, sub, url, pin, status, hint}) {
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            lp.topMargin = 22;
            col.addView(t, lp);
        }
        setContentView(root);
        root.setSystemUiVisibility(View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);

        Intent i = new Intent(this, ReceiverService.class);
        if (Build.VERSION.SDK_INT >= 26) startForegroundService(i);
        else startService(i);
    }

    @Override protected void onResume() {
        super.onResume();
        handler.post(refresh);
    }

    @Override protected void onPause() {
        super.onPause();
        handler.removeCallbacks(refresh);
    }

    private final Runnable refresh = new Runnable() {
        public void run() {
            Server s = ReceiverService.server;
            TvLink l = ReceiverService.link;
            if (s == null || l == null) {
                url.setText("…");
                setQr("");
                String e = ReceiverService.startError;
                status.setText(e.isEmpty() ? "Starting…" : "Could not start: " + e);
                hint.setText("");
            } else {
                String addr = "http://" + s.lanIp() + ":" + s.port;
                url.setText(addr);
                pin.setText("PIN  " + s.auth.pin());
                setQr(addr + "/#pin=" + s.auth.pin());
                String err = l.error;
                if (err.equals("adb_off")) {
                    status.setText("Turn on network debugging on this TV");
                    hint.setText("Settings > Device Preferences > Developer options > USB debugging / Network debugging");
                } else if (err.equals("adb_authorize")) {
                    status.setText("Allow the connection on the TV screen");
                    hint.setText("Choose Allow on the \"Allow USB debugging?\" message and tick Always allow");
                } else if (l.connected) {
                    status.setText("Connected and ready");
                    hint.setText("Control this TV from your phone. You can leave this screen.");
                } else {
                    status.setText("Ready. Scan the code, or open the address and type the PIN.");
                    hint.setText("On iPhone: Safari, Share, Add to Home Screen. On Android: Chrome menu, Install app.");
                }
            }
            handler.postDelayed(this, 1000);
        }
    };

    private void setQr(String s) {
        if (s.equals(qrText)) return;
        qrText = s;
        qr.set(s);
    }

    /** Draws the QR code in black on white, with the quiet zone readers need. */
    private static class QrView extends View {
        private Qr code;
        private final Paint paint = new Paint();

        QrView(Context c) { super(c); }

        void set(String s) {
            code = null;
            if (!s.isEmpty()) {
                try { code = Qr.encode(s); } catch (RuntimeException ignored) { }
            }
            invalidate();
        }

        @Override protected void onDraw(Canvas c) {
            int w = getWidth(), h = getHeight();
            paint.setColor(Color.WHITE);
            c.drawRoundRect(0, 0, w, h, 28, 28, paint);
            if (code == null) return;
            int cells = code.size + 8;
            float m = Math.min(w, h) / (float) cells;
            paint.setColor(Color.BLACK);
            for (int y = 0; y < code.size; y++)
                for (int x = 0; x < code.size; x++)
                    if (code.get(x, y)) c.drawRect((x + 4) * m, (y + 4) * m, (x + 5) * m, (y + 5) * m, paint);
        }
    }

    private TextView text(String s, int sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD);
        return t;
    }
}
