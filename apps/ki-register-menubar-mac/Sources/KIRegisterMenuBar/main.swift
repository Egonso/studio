import AppKit
import SwiftUI
import WebKit

private enum CaptureConfig {
  static let defaultBaseURL = "https://app.kiregister.com"
  static let storageKey = "quickCaptureBaseURL"
}

@main
struct KIRegisterMenuBarApp: App {
  var body: some Scene {
    MenuBarExtra("KI-Register", systemImage: "doc.text.badge.plus") {
      MenuBarCaptureView()
    }
    .menuBarExtraStyle(.window)
  }
}

private struct MenuBarCaptureView: View {
  @AppStorage(CaptureConfig.storageKey) private var baseURL: String = CaptureConfig.defaultBaseURL
  @State private var draftBaseURL: String = CaptureConfig.defaultBaseURL
  @State private var reloadToken = UUID()
  @State private var statusMessage = "Bereit."
  @State private var hasError = false

  private var captureURL: URL? {
    guard let normalized = normalizeBaseURL(baseURL) else { return nil }
    guard var components = URLComponents(url: normalized, resolvingAgainstBaseURL: false) else {
      return nil
    }

    components.path = "/capture"
    components.queryItems = [
      URLQueryItem(name: "source", value: "menubar-app")
    ]

    return components.url
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      VStack(alignment: .leading, spacing: 6) {
        Text("KI-Register Quick Capture")
          .font(.headline)

        Text("Direkt aus der Menüleiste erfassen.")
          .font(.subheadline)
          .foregroundStyle(.secondary)
      }

      VStack(alignment: .leading, spacing: 6) {
        Text("Basis-URL")
          .font(.caption)
          .foregroundStyle(.secondary)

        TextField("https://app.kiregister.com", text: $draftBaseURL)
          .textFieldStyle(.roundedBorder)
      }

      HStack(spacing: 8) {
        Button("Speichern") {
          saveBaseURL()
        }

        Button("Neu laden") {
          reloadToken = UUID()
          statusMessage = "Neu geladen."
          hasError = false
        }

        Button("Im Browser öffnen") {
          openInBrowser()
        }
      }
      .buttonStyle(.bordered)

      Group {
        if let url = captureURL {
          QuickCaptureWebView(url: url, reloadToken: reloadToken)
            .frame(width: 500, height: 700)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(
              RoundedRectangle(cornerRadius: 10)
                .stroke(Color.secondary.opacity(0.15), lineWidth: 1)
            )
        } else {
          VStack(spacing: 10) {
            Image(systemName: "exclamationmark.triangle")
              .font(.system(size: 22))
              .foregroundStyle(.secondary)
            Text("Ungültige URL")
              .font(.headline)
            Text("Bitte eine gültige http(s)-Basis-URL speichern.")
              .font(.subheadline)
              .foregroundStyle(.secondary)
          }
          .frame(width: 500, height: 700)
        }
      }

      Text(statusMessage)
        .font(.caption)
        .foregroundStyle(hasError ? Color.red : Color.secondary)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    .padding(14)
    .frame(width: 528)
    .onAppear {
      if draftBaseURL.isEmpty {
        draftBaseURL = baseURL
      }
    }
  }

  private func saveBaseURL() {
    guard let normalized = normalizeBaseURL(draftBaseURL) else {
      statusMessage = "Ungültige URL. Erlaubt: http oder https."
      hasError = true
      return
    }

    let absolute = normalized.absoluteString
    baseURL = absolute
    draftBaseURL = absolute
    statusMessage = "Gespeichert: \(absolute)"
    hasError = false
    reloadToken = UUID()
  }

  private func openInBrowser() {
    guard let url = captureURL else {
      statusMessage = "URL ist ungültig."
      hasError = true
      return
    }

    NSWorkspace.shared.open(url)
    statusMessage = "Im Browser geöffnet."
    hasError = false
  }

  private func normalizeBaseURL(_ raw: String) -> URL? {
    guard let url = URL(string: raw.trimmingCharacters(in: .whitespacesAndNewlines)) else {
      return nil
    }

    guard let scheme = url.scheme?.lowercased(), scheme == "http" || scheme == "https" else {
      return nil
    }

    guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
      return nil
    }

    components.path = ""
    components.query = nil
    components.fragment = nil

    return components.url
  }
}

private struct QuickCaptureWebView: NSViewRepresentable {
  let url: URL
  let reloadToken: UUID

  final class Coordinator {
    var lastReloadToken: UUID?
  }

  func makeCoordinator() -> Coordinator {
    Coordinator()
  }

  func makeNSView(context: Context) -> WKWebView {
    let configuration = WKWebViewConfiguration()
    configuration.defaultWebpagePreferences.allowsContentJavaScript = true
    configuration.websiteDataStore = .default()

    let webView = WKWebView(frame: .zero, configuration: configuration)
    webView.allowsBackForwardNavigationGestures = true
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
