package ru.dachatrunk.game;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.WebViewAssetLoader;
import com.yandex.mobile.ads.common.AdError;
import com.yandex.mobile.ads.common.AdRequest;
import com.yandex.mobile.ads.common.AdRequestError;
import com.yandex.mobile.ads.common.ImpressionData;
import com.yandex.mobile.ads.common.YandexAds;
import com.yandex.mobile.ads.rewarded.Reward;
import com.yandex.mobile.ads.rewarded.RewardedAd;
import com.yandex.mobile.ads.rewarded.RewardedAdEventListener;
import com.yandex.mobile.ads.rewarded.RewardedAdLoadListener;
import com.yandex.mobile.ads.rewarded.RewardedAdLoader;
import java.io.ByteArrayInputStream;
import java.util.Collections;
import org.json.JSONException;
import org.json.JSONObject;
import ru.rustore.sdk.review.RuStoreReviewManager;
import ru.rustore.sdk.review.RuStoreReviewManagerFactory;

/** Android host for bundled, offline-first game assets. No remote page gets the bridge. */
public final class MainActivity extends ComponentActivity {
    private static final String ORIGIN = "https://appassets.androidplatform.net";
    private static final String ASSET_PREFIX = "/assets/game/";
    private static final long LOAD_TIMEOUT_MS = 30_000;
    private final Handler main = new Handler(Looper.getMainLooper());
    private WebView webView;
    private RewardedAdLoader loader;
    private RewardedAd ad;
    private String pendingRequest;
    private boolean earnedReward;
    private boolean sdkReady;
    private boolean sdkStarting;
    private boolean destroyed;
    private boolean foreground;
    private boolean reviewBusy;
    private final Runnable loadingTimeout = () -> {
        if (pendingRequest != null && ad == null) {
            if (loader != null) loader.cancelLoading();
            finishAd("unavailable");
        }
    };

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    public void onCreate(@Nullable Bundle state) {
        super.onCreate(state);
        final FrameLayout container = new FrameLayout(this);
        container.setBackgroundColor(Color.rgb(247, 242, 232));
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(247, 242, 232));
        container.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        setContentView(container);
        ViewCompat.setOnApplyWindowInsetsListener(container, (view, windowInsets) -> {
            Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            view.setPadding(insets.left, insets.top, insets.right, insets.bottom);
            return windowInsets;
        });
        final WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        // Assets are provided by the loader, never the network. Ads use the native SDK.
        settings.setBlockNetworkLoads(true);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (isGameUrl(uri)) {
                    WebResourceResponse response = assetLoader.shouldInterceptRequest(uri);
                    if (response != null) return response;
                }
                return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found",
                        Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (isGameUrl(request.getUrl())) return false;
                if (request.isForMainFrame() && request.hasGesture()) openExternalUrl(request.getUrl().toString());
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new NativeBridge(), "DachaNative");
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() { emit("native-back", new JSONObject()); }
        });
        webView.loadUrl(ORIGIN + ASSET_PREFIX + "index.html");
    }

    private static boolean isGameUrl(Uri uri) {
        return "https".equals(uri.getScheme()) && "appassets.androidplatform.net".equals(uri.getHost())
                && uri.getPort() == -1 && uri.getPath() != null && uri.getPath().startsWith(ASSET_PREFIX);
    }

    private boolean adConfigured() {
        String id = BuildConfig.YANDEX_REWARDED_AD_UNIT_ID;
        return !id.isEmpty() && (BuildConfig.DEBUG || !id.toLowerCase(java.util.Locale.ROOT).contains("demo"));
    }

    private void startAd(String requestId) {
        if (destroyed || !foreground) return;
        if (!adConfigured() || pendingRequest != null) {
            emitAd(requestId, "unavailable");
            return;
        }
        pendingRequest = requestId;
        earnedReward = false;
        main.postDelayed(loadingTimeout, LOAD_TIMEOUT_MS);
        if (sdkReady) {
            loadAd(requestId);
        } else if (!sdkStarting) {
            sdkStarting = true;
            // The game requests no location or advertising ID and does not opt into personalization.
            try {
                YandexAds.setUserConsent(false);
                YandexAds.setLocationTracking(false);
                YandexAds.initialize(this, () -> main.post(() -> {
                    sdkStarting = false;
                    if (destroyed) return;
                    sdkReady = true;
                    loader = new RewardedAdLoader(this);
                    if (pendingRequest != null) loadAd(pendingRequest);
                }));
            } catch (RuntimeException exception) {
                sdkStarting = false;
                finishAd("error");
            }
        }
    }

    private void loadAd(String requestId) {
        if (destroyed || !requestId.equals(pendingRequest)) return;
        if (loader == null) loader = new RewardedAdLoader(this);
        try {
        loader.loadAd(new AdRequest.Builder(BuildConfig.YANDEX_REWARDED_AD_UNIT_ID).build(), new RewardedAdLoadListener() {
            @Override public void onAdLoaded(@NonNull RewardedAd loadedAd) {
                if (destroyed || !requestId.equals(pendingRequest)) {
                    loadedAd.setAdEventListener(null);
                    return;
                }
                main.removeCallbacks(loadingTimeout);
                if (!foreground) { finishAd("unavailable"); return; }
                ad = loadedAd;
                ad.setAdEventListener(new RewardedAdEventListener() {
                    @Override public void onAdShown() { }
                    @Override public void onAdClicked() { }
                    @Override public void onAdImpression(@Nullable ImpressionData data) { }
                    @Override public void onRewarded(@NonNull Reward reward) {
                        // Exactly one result is sent after dismissal; never grant on dismissal alone.
                        if (requestId.equals(pendingRequest)) earnedReward = true;
                    }
                    @Override public void onAdDismissed() {
                        if (requestId.equals(pendingRequest)) finishAd(earnedReward ? "rewarded" : "dismissed");
                    }
                    @Override public void onAdFailedToShow(@NonNull AdError error) {
                        if (requestId.equals(pendingRequest)) finishAd("error");
                    }
                });
                try { ad.show(MainActivity.this); }
                catch (RuntimeException exception) { finishAd("error"); }
            }
            @Override public void onAdFailedToLoad(@NonNull AdRequestError error) {
                if (requestId.equals(pendingRequest)) finishAd("unavailable");
            }
        });
        } catch (RuntimeException exception) { finishAd("error"); }
    }

    private void finishAd(String status) {
        main.removeCallbacks(loadingTimeout);
        String requestId = pendingRequest;
        pendingRequest = null;
        earnedReward = false;
        if (ad != null) ad.setAdEventListener(null);
        ad = null;
        if (requestId != null) emitAd(requestId, status);
    }

    private void emitAd(String requestId, String status) {
        JSONObject detail = new JSONObject();
        try { detail.put("requestId", requestId); detail.put("status", status); }
        catch (JSONException ignored) { return; }
        emit("native-ad-result", detail);
    }

    private void emit(String type, JSONObject detail) {
        if (destroyed || webView == null) return;
        // JSONObject serialization quotes all callback data; never interpolate JS source from the bridge.
        webView.evaluateJavascript("window.dispatchEvent(new CustomEvent(" + JSONObject.quote(type)
                + ",{detail:" + detail + "}));", null);
    }

    private void startReview() {
        if (destroyed || !foreground || reviewBusy || pendingRequest != null) return;
        long last = getPreferences(MODE_PRIVATE).getLong("lastReviewAttempt", 0);
        long now = System.currentTimeMillis();
        if (now - last < 7L * 24 * 60 * 60 * 1000) return;
        reviewBusy = true;
        getPreferences(MODE_PRIVATE).edit().putLong("lastReviewAttempt", now).apply();
        try {
            RuStoreReviewManager manager = RuStoreReviewManagerFactory.INSTANCE.create(this);
            manager.requestReviewFlow().addOnSuccessListener(info -> {
                if (destroyed || !foreground) { reviewBusy = false; return; }
                manager.launchReviewFlow(info)
                        .addOnSuccessListener(unit -> reviewBusy = false)
                        .addOnFailureListener(error -> reviewBusy = false);
            }).addOnFailureListener(error -> reviewBusy = false);
        } catch (RuntimeException exception) { reviewBusy = false; }
        // Unavailable store / unpublished app / rate limits are normal. Do not interrupt the game.
    }

    private void openExternalUrl(String url) {
        if (url == null || url.length() > 2048) return;
        Uri uri = Uri.parse(url);
        if (!"https".equals(uri.getScheme()) && !"http".equals(uri.getScheme())) return;
        if (uri.getHost() == null || uri.getUserInfo() != null) return;
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)); }
        catch (ActivityNotFoundException ignored) { }
    }

    public final class NativeBridge {
        @JavascriptInterface public String getCapabilities() {
            JSONObject result = new JSONObject();
            try {
                result.put("platform", "android");
                result.put("rewardedAds", adConfigured());
                result.put("adsMode", BuildConfig.DEBUG ? "test" : adConfigured() ? "production" : "unconfigured");
                result.put("review", true);
            } catch (JSONException ignored) { }
            return result.toString();
        }
        @JavascriptInterface public void showRewarded(String requestId) {
            if (requestId == null || !requestId.matches("[a-zA-Z0-9_-]{1,100}")) return;
            main.post(() -> startAd(requestId));
        }
        @JavascriptInterface public void requestReview() { main.post(() -> startReview()); }
        @JavascriptInterface public void openExternal(String url) { main.post(() -> openExternalUrl(url)); }
        @JavascriptInterface public void closeApp() { main.post(() -> finish()); }
    }

    @Override protected void onResume() {
        super.onResume();
        foreground = true;
        // Restore the game's system-bar contrast after a full-screen SDK activity.
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView()).setAppearanceLightStatusBars(true);
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView()).setAppearanceLightNavigationBars(true);
        if (webView != null) webView.onResume();
    }
    @Override protected void onPause() {
        foreground = false;
        if (webView != null) webView.onPause();
        super.onPause();
    }
    @Override protected void onDestroy() {
        destroyed = true;
        main.removeCallbacksAndMessages(null);
        if (loader != null) loader.cancelLoading();
        loader = null;
        if (ad != null) ad.setAdEventListener(null);
        ad = null;
        if (webView != null) {
            webView.removeJavascriptInterface("DachaNative");
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
