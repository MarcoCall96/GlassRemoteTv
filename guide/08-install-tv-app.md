# 8. Install the TV app (no computer needed)

> Italiano: [it/08-installare-app-tv.md](it/08-installare-app-tv.md)

The full, step-by-step guide to install the GlassRemoteTv app on your Android TV / Google TV is in [AppTv/guide/01-install-on-your-tv.md](../AppTv/guide/01-install-on-your-tv.md). In short:

1. **Get the APK** (USB stick and adb methods) from the [Releases page](https://github.com/MarcoCall96/GlassRemoteTv/releases) (or from [AppTv/release/](../AppTv/release/)) and check its checksum. With the Downloader app nothing is downloaded in this step: the TV downloads the file over HTTPS in step 2, and the on-TV hash check is skipped (an AI assistant can check the file in the repository against `SHA256SUMS.txt` for you).
2. **Install it on the TV** with the Downloader app, a USB stick or adb.
3. **Turn on network debugging** in the TV Developer options (read [AppTv/guide/02-security.md](../AppTv/guide/02-security.md) first).
4. **Open the app on the TV**, tick *Always allow from this computer* and press *Allow* once, then scan the QR code with your phone (keep the app open on the TV: the PIN is shown there).

Everything about the TV release (security, troubleshooting, building it yourself) is in [AppTv/README.md](../AppTv/README.md).
