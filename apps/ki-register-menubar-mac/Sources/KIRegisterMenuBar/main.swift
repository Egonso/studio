import AppKit
import SwiftUI
import WebKit

private enum CaptureConfig {
  static let captureURL = URL(string: "https://app.kiregister.com/capture?source=menubar-app")!
}

@main
struct KIRegisterMenuBarApp: App {
  @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

  var body: some Scene {
    MenuBarExtra("KI-Register", systemImage: "sparkles.rectangle.stack.fill") {
      MenuBarCaptureView()
    }
    .menuBarExtraStyle(.window)
  }
}

private final class AppDelegate: NSObject, NSApplicationDelegate {
  func applicationDidFinishLaunching(_ notification: Notification) {
    NSApp.setActivationPolicy(.accessory)
  }
}

private struct MenuBarCaptureView: View {
  @State private var reloadToken = UUID()
  @State private var isLoading = true
  private let captureURL = CaptureConfig.captureURL

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      HStack(alignment: .center, spacing: 10) {
        Text("KI-Register Quick Capture")
          .font(.headline)

        Text("Menüleiste")
          .font(.subheadline)
          .foregroundStyle(.secondary)

        Spacer()

        Button {
          reloadToken = UUID()
        } label: {
          Image(systemName: "arrow.clockwise")
            .font(.system(size: 13, weight: .semibold))
        }
        .buttonStyle(.borderless)
        .help("Neu laden")

        Button {
          openInBrowser()
        } label: {
          Image(systemName: "safari")
            .font(.system(size: 13, weight: .semibold))
        }
        .buttonStyle(.borderless)
        .help("Im Browser öffnen")
      }
      .padding(.horizontal, 2)

      ZStack {
        QuickCaptureWebView(url: captureURL, reloadToken: reloadToken, isLoading: $isLoading)
          .clipShape(RoundedRectangle(cornerRadius: 12))
          .overlay(
            RoundedRectangle(cornerRadius: 12)
              .stroke(Color.secondary.opacity(0.15), lineWidth: 1)
          )

        if isLoading {
          ProgressView("Lade Quick Capture …")
            .controlSize(.small)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 8))
        }
      }
      .frame(width: 500, height: 740)

      Text("Nicht eingeloggt? In der Maske anmelden oder als Gast lokal speichern.")
        .font(.caption)
        .foregroundStyle(.secondary)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    .padding(12)
    .frame(width: 528)
  }

  private func openInBrowser() {
    NSWorkspace.shared.open(captureURL)
  }
}

private struct QuickCaptureWebView: NSViewRepresentable {
  let url: URL
  let reloadToken: UUID
  @Binding var isLoading: Bool

  final class Coordinator: NSObject, WKNavigationDelegate {
    var isLoading: Binding<Bool>
    var lastReloadToken: UUID?

    init(isLoading: Binding<Bool>) {
      self.isLoading = isLoading
    }

    func webView(
      _ webView: WKWebView,
      didStartProvisionalNavigation navigation: WKNavigation!
    ) {
      isLoading.wrappedValue = true
    }

    func webView(
      _ webView: WKWebView,
      didFinish navigation: WKNavigation!
    ) {
      isLoading.wrappedValue = false
    }

    func webView(
      _ webView: WKWebView,
      didFail navigation: WKNavigation!,
      withError error: any Error
    ) {
      isLoading.wrappedValue = false
    }

    func webView(
      _ webView: WKWebView,
      didFailProvisionalNavigation navigation: WKNavigation!,
      withError error: any Error
    ) {
      isLoading.wrappedValue = false
    }
  }

  func makeCoordinator() -> Coordinator {
    Coordinator(isLoading: $isLoading)
  }

  func makeNSView(context: Context) -> WKWebView {
    let configuration = WKWebViewConfiguration()
    configuration.defaultWebpagePreferences.allowsContentJavaScript = true
    configuration.websiteDataStore = .default()

    let webView = WKWebView(frame: .zero, configuration: configuration)
    webView.allowsBackForwardNavigationGestures = true
    webView.navigationDelegate = context.coordinator
    webView.load(URLRequest(url: url))
    context.coordinator.lastReloadToken = reloadToken
    return webView
  }

  func updateNSView(_ webView: WKWebView, context: Context) {
    let shouldReloadForToken = context.coordinator.lastReloadToken != reloadToken
    let shouldReloadForURL = webView.url?.absoluteString != url.absoluteString

    if shouldReloadForToken || shouldReloadForURL {
      webView.load(URLRequest(url: url))
      context.coordinator.lastReloadToken = reloadToken
    }
  }
}
