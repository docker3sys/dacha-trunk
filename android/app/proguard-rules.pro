# These methods are called from the bundled game's JavaScript bridge.
-keepclassmembers class ru.dachatrunk.game.MainActivity$NativeBridge {
    @android.webkit.JavascriptInterface <methods>;
}
