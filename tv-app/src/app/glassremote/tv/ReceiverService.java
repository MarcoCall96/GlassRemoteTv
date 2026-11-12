package app.glassremote.tv;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

/** Keeps the receiver running in the background so phones on the home network can reach it. */
public class ReceiverService extends Service {
    static volatile TvLink link;
    static volatile Server server;
    static volatile String startError = "";
    private static boolean starting;

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(1, notification());
        startAll();
        return START_STICKY;
    }

    private Notification notification() {
        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            nm.createNotificationChannel(new NotificationChannel("receiver", "Receiver", NotificationManager.IMPORTANCE_MIN));
            b = new Notification.Builder(this, "receiver");
        } else {
            b = new Notification.Builder(this);
        }
        return b.setContentTitle("GlassRemoteTv").setContentText("Ready")
                .setSmallIcon(getApplicationInfo().icon).build();
    }

    private synchronized void startAll() {
        if (server != null || starting) return;
        starting = true;
        new Thread(new Runnable() {
            public void run() {
                try {
                    Identity id = Identity.loadOrCreate(getFilesDir());
                    final Server[] holder = new Server[1];
                    TvLink l = new TvLink(id, new TvLink.Listener() {
                        public void changed() {
                            Server s = holder[0];
                            if (s != null) s.broadcastState();
                        }
                    });
                    Server s = new Server(getApplicationContext(), l);
                    holder[0] = s;
                    s.start();
                    l.start();
                    link = l;
                    server = s;
                    startError = "";
                } catch (Throwable e) {
                    startError = String.valueOf(e);
                    Log.e("GlassRemoteTv", "start failed", e);
                } finally {
                    starting = false;
                }
            }
        }, "receiver-start").start();
    }

    @Override public IBinder onBind(Intent intent) { return null; }
}
