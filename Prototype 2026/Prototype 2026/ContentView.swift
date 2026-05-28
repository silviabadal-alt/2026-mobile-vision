import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        WebView()
            .ignoresSafeArea()
    }
}

struct WebView: UIViewRepresentable {

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        // Console passthrough
        let logScript = WKUserScript(
            source: """
            window.onerror = function(msg, src, line) {
                window.webkit.messageHandlers.jslog.postMessage('ERR: ' + msg + ' @ ' + src + ':' + line);
            };
            """,
            injectionTime: .atDocumentStart, forMainFrameOnly: true)
        config.userContentController.addUserScript(logScript)
        config.userContentController.add(context.coordinator, name: "jslog")
        config.userContentController.add(context.coordinator, name: "haptic")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.bounces = false

        if let url  = Bundle.main.url(forResource: "combined", withExtension: "html"),
           let html = try? String(contentsOf: url, encoding: .utf8) {
            webView.loadHTMLString(html, baseURL: URL(string: "https://localhost"))
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    class Coordinator: NSObject, WKScriptMessageHandler {
        func userContentController(_ controller: WKUserContentController,
                                   didReceive message: WKScriptMessage) {
            if message.name == "jslog" {
                print("[JS] \(message.body)")
                return
            }
            if message.name == "haptic" {
                let style = message.body as? String ?? "light"
                DispatchQueue.main.async {
                    switch style {
                    case "medium": UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    case "heavy":  UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
                    case "soft":   UIImpactFeedbackGenerator(style: .soft).impactOccurred()
                    case "rigid":  UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
                    default:       UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    }
                }
            }
        }
    }
}
