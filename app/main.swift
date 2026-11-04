// Earth Now (Live Earth Wallpaper) – shows web/index.html as an animated desktop background.
// One borderless window per screen at desktop level (below the desktop icons),
// click-through, on all Spaces. Controlled from the menu bar icon and a settings
// window with a live preview.
//
// UI strings are English; translations live in app/Localization/<lang>.lproj.

import AppKit
import Combine
import MapKit
import ServiceManagement
import SwiftUI
import UniformTypeIdentifiers
import WebKit

/// Localized UI string (English source, see app/Localization).
func L(_ key: String) -> String { NSLocalizedString(key, comment: "") }

// MARK: - Configuration (passed to the web page 1:1 as JSON)

enum Motion: String, Codable, CaseIterable, Identifiable {
    case orbit, fixed, sun
    var id: String { rawValue }
    var title: String {
        switch self {
        case .orbit: return L("Orbit")
        case .fixed: return L("Stay Above Place")
        case .sun: return L("Follow the Sun")
        }
    }
    var help: String {
        switch self {
        case .orbit: return L("The camera slowly circles the Earth – day and night stay true to the real time.")
        case .fixed: return L("The camera stays above your place – watch day turn into night there, live.")
        case .sun: return L("The line between day and night stays in view while the Earth turns beneath it in real time.")
        }
    }
}

enum CloudMode: String, Codable, CaseIterable, Identifiable {
    case live, `static`, off
    var id: String { rawValue }
    var title: String {
        switch self {
        case .live: return L("Live")
        case .static: return L("Static")
        case .off: return L("Off")
        }
    }
}

struct EarthConfig: Codable, Equatable {
    var motion: Motion = .orbit
    var speed: Double = 0.4
    var lat: Double = 51.0
    var lon: Double = 10.0
    var place: String = L("Germany")
    var zoom: Double = 0.62
    var pitch: Double = 0
    var heading: Double = 0
    var tilt: Double = 18
    var fov: Double = 30
    var x: Double = 0
    var y: Double = 0
    var fps: Int = 30
    var hud: Bool = false
    var clouds: CloudMode = .live

    var json: String {
        String(data: try! JSONEncoder().encode(self), encoding: .utf8)!
    }
}

/// A view = camera settings without place and motion.
struct ViewPreset: Codable, Identifiable, Equatable {
    var id = UUID()
    var name: String
    var symbol: String = "star"
    var zoom: Double, pitch: Double, heading: Double, tilt: Double, fov: Double, x: Double, y: Double
    var builtin = false
    /// Mirrorable: the Earth can sit on the left or right (optional so older saved views still decode)
    var mirrorable: Bool? = nil

    static let builtins: [ViewPreset] = [
        .init(name: L("Whole Earth"), symbol: "globe.europe.africa", zoom: 0.62, pitch: 0, heading: 0, tilt: 18, fov: 30, x: 0, y: 0, builtin: true),
        .init(name: L("Close-up"), symbol: "circle.bottomhalf.filled", zoom: 2.2, pitch: 20, heading: 0, tilt: 0, fov: 30, x: 0, y: -0.35, builtin: true),
        .init(name: L("Horizon"), symbol: "sunrise", zoom: 4.2, pitch: 66, heading: 0, tilt: 0, fov: 50, x: 0, y: 0, builtin: true),
        .init(name: L("Side View"), symbol: "circle.righthalf.filled", zoom: 1.25, pitch: 0, heading: 0, tilt: 20, fov: 30, x: 0.55, y: 0, builtin: true, mirrorable: true),
        .init(name: L("Far Out"), symbol: "smallcircle.filled.circle", zoom: 0.3, pitch: 0, heading: 0, tilt: 18, fov: 30, x: 0, y: 0, builtin: true),
    ]

    /// Left variant: x and rotation mirrored.
    var mirrored: ViewPreset {
        var v = self; v.x = -x; v.tilt = -tilt; return v
    }

    func matches(_ c: EarthConfig) -> Bool {
        func eq(_ v: ViewPreset) -> Bool {
            abs(c.zoom - v.zoom) < 0.01 && abs(c.pitch - v.pitch) < 0.5 && abs(c.heading - v.heading) < 0.5 &&
                abs(c.tilt - v.tilt) < 0.5 && abs(c.fov - v.fov) < 0.5 && abs(c.x - v.x) < 0.01 && abs(c.y - v.y) < 0.01
        }
        return eq(self) || (mirrorable == true && eq(mirrored))
    }

    func apply(to c: inout EarthConfig, left: Bool = false) {
        let v = mirrorable == true && left ? mirrored : self
        c.zoom = v.zoom; c.pitch = v.pitch; c.heading = v.heading; c.tilt = v.tilt; c.fov = v.fov; c.x = v.x; c.y = v.y
    }
}

struct Place: Codable, Identifiable, Equatable {
    var id = UUID()
    var name: String
    var lat: Double
    var lon: Double

    static let quick: [Place] = [
        .init(name: L("Germany"), lat: 51.0, lon: 10.0),
        .init(name: L("Europe"), lat: 48.0, lon: 12.0),
        .init(name: L("North America"), lat: 40.0, lon: -98.0),
        .init(name: L("South America"), lat: -15.0, lon: -60.0),
        .init(name: L("Africa"), lat: 5.0, lon: 20.0),
        .init(name: L("Asia"), lat: 30.0, lon: 95.0),
        .init(name: L("Australia"), lat: -25.0, lon: 134.0),
        .init(name: L("North Pole"), lat: 80.0, lon: 0.0),
    ]
}

// MARK: - Store

final class Store: ObservableObject {
    static let shared = Store()
    private let d = UserDefaults.standard

    @Published var config: EarthConfig { didSet { save("config", config) } }
    @Published var customViews: [ViewPreset] { didSet { save("customViews", customViews) } }
    @Published var recentPlaces: [Place] { didSet { save("recentPlaces", recentPlaces) } }

    var allViews: [ViewPreset] { ViewPreset.builtins + customViews }
    var currentView: ViewPreset? { allViews.first { $0.matches(config) } }

    private init() {
        Store.migrateFromLiveEarth()
        func load<T: Decodable>(_ key: String, _ fallback: T) -> T {
            guard let data = UserDefaults.standard.data(forKey: key),
                  let v = try? JSONDecoder().decode(T.self, from: data) else { return fallback }
            return v
        }
        config = load("config", EarthConfig())
        customViews = load("customViews", [])
        recentPlaces = load("recentPlaces", [])
        earthLeft = UserDefaults.standard.bool(forKey: "earthLeft")  // re-read after migration
    }

    /// Take over settings from earlier bundle IDs (local.earthnow, and local.liveearth
    /// from before the rename) so updating keeps the user's views and place.
    private static func migrateFromLiveEarth() {
        let d = UserDefaults.standard
        guard d.object(forKey: "config") == nil else { return }
        for suite in ["local.earthnow", "local.liveearth"] {
            guard let old = UserDefaults(suiteName: suite), old.object(forKey: "config") != nil else { continue }
            for key in ["config", "customViews", "recentPlaces", "earthLeft"] {
                if let v = old.object(forKey: key) { d.set(v, forKey: key) }
            }
            return
        }
    }

    private func save<T: Encodable>(_ key: String, _ value: T) {
        d.set(try? JSONEncoder().encode(value), forKey: key)
    }

    func setPlace(_ p: Place) {
        config.lat = p.lat; config.lon = p.lon; config.place = p.name
        if !Place.quick.contains(where: { $0.name == p.name }) {
            recentPlaces.removeAll { $0.name == p.name }
            recentPlaces.insert(p, at: 0)
            recentPlaces = Array(recentPlaces.prefix(6))
        }
    }

    /// Preferred side for mirrorable views (e.g. "Side View")
    @Published var earthLeft: Bool = UserDefaults.standard.bool(forKey: "earthLeft") {
        didSet {
            d.set(earthLeft, forKey: "earthLeft")
            if let v = currentView, v.mirrorable == true { v.apply(to: &config, left: earthLeft) }
        }
    }

    func applyView(_ v: ViewPreset) { v.apply(to: &config, left: earthLeft) }

    func saveCurrentView(named name: String) {
        let c = config
        customViews.append(ViewPreset(name: name, zoom: c.zoom, pitch: c.pitch, heading: c.heading,
                                      tilt: c.tilt, fov: c.fov, x: c.x, y: c.y))
    }
}

// MARK: - Serve the web page from the app bundle via a custom URL scheme
// (file:// does not allow ES modules; earth://app/... behaves like a web server.)

final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    let root: URL
    init(root: URL) { self.root = root }

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let file = root.appendingPathComponent(String(path.dropFirst())).standardizedFileURL
        guard file.path.hasPrefix(root.standardizedFileURL.path),
              let data = try? Data(contentsOf: file) else {
            task.didFailWithError(URLError(.fileDoesNotExist))
            return
        }
        let mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
        let resp = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1",
                                   headerFields: ["Content-Type": mime, "Access-Control-Allow-Origin": "*"])!
        task.didReceive(resp)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}

final class JSLogger: NSObject, WKScriptMessageHandler {
    static let shared = JSLogger()
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        FileHandle.standardError.write("[web] \(m.body)\n".data(using: .utf8)!)
    }
}

/// All Earth views (desktop windows + preview) – they receive changes live.
final class EarthViews {
    static let shared = EarthViews()
    private let views = NSHashTable<WKWebView>.weakObjects()
    private let webRoot = Bundle.main.resourceURL!.appendingPathComponent("web")
    private var sub: AnyCancellable?

    private init() {
        sub = Store.shared.$config
            .removeDuplicates()
            .throttle(for: .milliseconds(30), scheduler: RunLoop.main, latest: true)
            .sink { [weak self] c in self?.eval("window.applyConfig && applyConfig(\(c.json))") }
    }

    func make(frame: NSRect) -> WKWebView {
        let conf = WKWebViewConfiguration()
        conf.setURLSchemeHandler(BundleSchemeHandler(root: webRoot), forURLScheme: "earth")
        let ucc = conf.userContentController
        ucc.add(JSLogger.shared, name: "log")
        ucc.addUserScript(WKUserScript(source: """
            window.__initialConfig = \(Store.shared.config.json);
            const _l = m => window.webkit.messageHandlers.log.postMessage(String(m));
            addEventListener('error', e => _l('error: ' + e.message + ' @ ' + e.filename + ':' + e.lineno));
            addEventListener('unhandledrejection', e => _l('rejection: ' + e.reason));
            """, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        let web = WKWebView(frame: frame, configuration: conf)
        web.setValue(false, forKey: "drawsBackground")
        if #available(macOS 13.3, *) { web.isInspectable = true }
        web.load(URLRequest(url: URL(string: "earth://app/index.html")!))
        views.add(web)
        return web
    }

    func eval(_ js: String) { views.allObjects.forEach { $0.evaluateJavaScript(js) } }

    /// Screens asleep → pause everything
    var screensAsleep = false { didSet { updatePause() } }

    /// Each view pauses while its window is fully covered or closed
    /// (full-screen apps, closed settings window, screens off).
    func updatePause() {
        for web in views.allObjects {
            let visible = web.window.map { $0.isVisible && $0.occlusionState.contains(.visible) } ?? false
            web.evaluateJavaScript("window.setPaused && setPaused(\(screensAsleep || !visible))")
        }
    }
}

// MARK: - Place search (Apple Maps)

final class PlaceSearch: NSObject, ObservableObject, MKLocalSearchCompleterDelegate {
    @Published var query = "" { didSet { update() } }
    @Published var results: [MKLocalSearchCompletion] = []
    @Published var busy = false
    private let completer = MKLocalSearchCompleter()

    override init() {
        super.init()
        completer.delegate = self
        completer.resultTypes = [.address, .pointOfInterest]
    }

    private func update() {
        if query.trimmingCharacters(in: .whitespaces).isEmpty { results = []; return }
        completer.queryFragment = query
    }

    func completerDidUpdateResults(_ c: MKLocalSearchCompleter) { results = Array(c.results.prefix(6)) }
    func completer(_ c: MKLocalSearchCompleter, didFailWithError error: Error) { results = [] }

    func resolve(_ completion: MKLocalSearchCompletion, done: @escaping (Place) -> Void) {
        busy = true
        MKLocalSearch(request: .init(completion: completion)).start { [weak self] resp, _ in
            self?.busy = false
            guard let item = resp?.mapItems.first else { return }
            let coord: CLLocationCoordinate2D
            if #available(macOS 26.0, *) { coord = item.location.coordinate } else { coord = item.placemark.coordinate }
            done(Place(name: completion.title, lat: coord.latitude, lon: coord.longitude))
            self?.query = ""
            self?.results = []
        }
    }
}

// MARK: - Settings window

struct EarthPreview: NSViewRepresentable {
    func makeNSView(context: Context) -> WKWebView { EarthViews.shared.make(frame: .zero) }
    func updateNSView(_ v: WKWebView, context: Context) {}
}

// @State needs the Xcode macro plugin – with the Command Line Tools we use ObservableObject
final class SettingsUIState: ObservableObject {
    @Published var naming = false
    @Published var newViewName = ""
}

struct SettingsView: View {
    @ObservedObject var store = Store.shared
    @StateObject var search = PlaceSearch()
    @StateObject var ui = SettingsUIState()

    var body: some View {
        VStack(spacing: 0) {
            EarthPreview()
                .frame(height: 300)
                .overlay(alignment: .bottomLeading) {
                    Text(L("Preview – changes apply to your desktop right away"))
                        .font(.caption).foregroundStyle(.white.opacity(0.6)).padding(10)
                }
            Form {
                viewSection
                placeSection
                cameraSection
                displaySection
            }
            .formStyle(.grouped)
        }
        .frame(width: 560)
        .frame(minHeight: 700)
    }

    // View
    private var viewSection: some View {
        Section {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(store.allViews) { v in
                        let active = store.currentView?.id == v.id
                        Button { store.applyView(v) } label: {
                            VStack(spacing: 6) {
                                Image(systemName: v.symbol).font(.system(size: 22))
                                Text(v.name).font(.caption).lineLimit(1)
                            }
                            .frame(width: 92, height: 64)
                            .background(RoundedRectangle(cornerRadius: 10)
                                .fill(active ? Color.accentColor.opacity(0.25) : Color.secondary.opacity(0.1)))
                            .overlay(RoundedRectangle(cornerRadius: 10)
                                .stroke(active ? Color.accentColor : .clear, lineWidth: 2))
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .contextMenu {
                            if !v.builtin {
                                Button(L("Delete View"), role: .destructive) {
                                    store.customViews.removeAll { $0.id == v.id }
                                }
                            }
                        }
                    }
                }
                .padding(.vertical, 2)
            }
            if store.currentView?.mirrorable == true {
                Picker(L("Earth Position"), selection: $store.earthLeft) {
                    Label(L("Left"), systemImage: "circle.lefthalf.filled").tag(true)
                    Label(L("Right"), systemImage: "circle.righthalf.filled").tag(false)
                }
                .pickerStyle(.segmented)
            }
            HStack {
                Text(store.currentView == nil ? L("Custom setting (not saved yet)")
                                              : L("Right-click a custom view to delete it"))
                    .font(.caption).foregroundStyle(.secondary)
                Spacer()
                Button(L("Save as View…")) { ui.newViewName = ""; ui.naming = true }
                    .disabled(store.currentView != nil)
            }
        } header: { Text(L("View")) }
        .alert(L("Save View"), isPresented: $ui.naming) {
            TextField(L("Name"), text: $ui.newViewName)
            Button(L("Save")) {
                let name = ui.newViewName.trimmingCharacters(in: .whitespaces)
                store.saveCurrentView(named: name.isEmpty ? L("My View") : name)
            }
            Button(L("Cancel"), role: .cancel) {}
        } message: { Text(L("Saves zoom, tilt and framing as a custom view.")) }
    }

    // Place & motion
    private var placeSection: some View {
        Section {
            LabeledContent(L("Current Place")) {
                Text("\(store.config.place)  ·  \(coord(store.config.lat, "N", "S")), \(coord(store.config.lon, L("E"), "W"))")
                    .foregroundStyle(.secondary)
            }
            TextField(L("Search Place"), text: $search.query, prompt: Text(L("Search for a city, country or address…")))
                .textFieldStyle(.roundedBorder)
                .labelsHidden()
            ForEach(search.results, id: \.self) { r in
                Button {
                    search.resolve(r) { store.setPlace($0) }
                } label: {
                    VStack(alignment: .leading) {
                        Text(r.title)
                        if !r.subtitle.isEmpty { Text(r.subtitle).font(.caption).foregroundStyle(.secondary) }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
            placeChips(Place.quick + store.recentPlaces)
            Picker(L("Motion"), selection: $store.config.motion) {
                ForEach(Motion.allCases) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)
            Text(store.config.motion.help).font(.caption).foregroundStyle(.secondary)
            if store.config.motion == .orbit {
                slider(L("Speed"), $store.config.speed, 0.02...3, log: true,
                       format: { String(format: L("%.0f min per orbit"), 360 / $0 / 60) })
            }
        } header: { Text(L("Place & Motion")) }
    }

    private func placeChips(_ places: [Place]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(places) { p in
                    Button(p.name) { store.setPlace(p) }
                        .buttonStyle(.bordered)
                        .tint(store.config.place == p.name ? .accentColor : nil)
                }
            }
        }
    }

    // Camera / zoom
    private var cameraSection: some View {
        Section {
            slider(L("Zoom"), $store.config.zoom, 0.15...8, log: true, format: { String(format: "%.2f×", $0) })
            slider(L("Pitch"), $store.config.pitch, 0...85, format: { "\(Int($0))°" })
            slider(L("Heading"), $store.config.heading, -180...180, format: { "\(Int($0))°" })
            slider(L("Rotation"), $store.config.tilt, -60...60, format: { "\(Int($0))°" })
            slider(L("Field of View"), $store.config.fov, 12...75, format: { "\(Int($0))°" })
            slider(L("Horizontal"), $store.config.x, -1.5...1.5, format: { String(format: "%+.2f", $0) })
            slider(L("Vertical"), $store.config.y, -1.5...1.5, format: { String(format: "%+.2f", $0) })
        } header: { Text(L("Zoom & Framing")) }
    }

    private var displaySection: some View {
        Section {
            Picker(L("Clouds"), selection: $store.config.clouds) {
                ForEach(CloudMode.allCases) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)
            Toggle(L("Show time & sun position"), isOn: $store.config.hud)
            Toggle(L("Maximum quality (60 fps, full resolution – uses more battery)"), isOn: Binding(
                get: { store.config.fps == 60 }, set: { store.config.fps = $0 ? 60 : 30 }))
        } header: { Text(L("Display")) } footer: {
            // Credits (EUMETSAT requires this notice when its cloud data is shown)
            Text(L("Earth imagery: NASA Blue Marble & Black Marble · Live clouds: matteason/live-cloud-maps, contains modified EUMETSAT data · 3D: three.js"))
                .font(.caption2).foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func slider(_ title: String, _ value: Binding<Double>, _ range: ClosedRange<Double>,
                        log: Bool = false, format: @escaping (Double) -> String) -> some View {
        // Logarithmic slider (zoom, speed): fine control at small values
        let b: Binding<Double> = log
            ? Binding(get: { Foundation.log(value.wrappedValue) }, set: { value.wrappedValue = exp($0) })
            : value
        let r = log ? Foundation.log(range.lowerBound)...Foundation.log(range.upperBound) : range
        return LabeledContent(title) {
            HStack {
                Slider(value: b, in: r)
                Text(format(value.wrappedValue)).monospacedDigit().foregroundStyle(.secondary)
                    .frame(width: 110, alignment: .trailing)
            }
        }
    }

    private func coord(_ v: Double, _ pos: String, _ neg: String) -> String {
        String(format: "%.2f° %@", abs(v), v >= 0 ? pos : neg)
    }
}

// MARK: - App

final class AppDelegate: NSObject, NSApplicationDelegate, NSMenuDelegate {
    var windows: [NSWindow] = []
    var statusItem: NSStatusItem!
    var settingsWindow: NSWindow?

    func applicationDidFinishLaunching(_ n: Notification) {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        statusItem.button?.image = NSImage(systemSymbolName: "globe.europe.africa.fill", accessibilityDescription: "Earth Now")
        let menu = NSMenu()
        menu.delegate = self
        statusItem.menu = menu

        rebuildWindows()
        NotificationCenter.default.addObserver(self, selector: #selector(rebuildWindows),
            name: NSApplication.didChangeScreenParametersNotification, object: nil)
        // Pause rendering while the screens sleep (saves battery)
        for name in [NSWindow.didChangeOcclusionStateNotification, NSWindow.willCloseNotification] {
            NotificationCenter.default.addObserver(self, selector: #selector(visibilityChanged), name: name, object: nil)
        }
        let ws = NSWorkspace.shared.notificationCenter
        ws.addObserver(self, selector: #selector(pause), name: NSWorkspace.screensDidSleepNotification, object: nil)
        ws.addObserver(self, selector: #selector(resume), name: NSWorkspace.screensDidWakeNotification, object: nil)

        let env = ProcessInfo.processInfo.environment
        if env["EARTHNOW_SETTINGS"] != nil { openSettings() }
        // Debug: save an image of the settings window (without the WebGL preview)
        if let out = env["EARTHNOW_SETTINGS_SNAPSHOT"] {
            DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
                guard let v = self.settingsWindow?.contentView,
                      let rep = v.bitmapImageRepForCachingDisplay(in: v.bounds) else { return }
                v.cacheDisplay(in: v.bounds, to: rep)
                try? rep.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: out))
            }
        }
        // Debug: EARTHNOW_SNAPSHOT=/path.png saves an image of the desktop after 8 s
        if let out = env["EARTHNOW_SNAPSHOT"] {
            DispatchQueue.main.asyncAfter(deadline: .now() + 8) {
                (self.windows.first?.contentView as? WKWebView)?.takeSnapshot(with: nil) { img, _ in
                    guard let tiff = img?.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff),
                          let png = rep.representation(using: .png, properties: [:]) else { return }
                    try? png.write(to: URL(fileURLWithPath: out))
                }
            }
        }
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        openSettings()
        return false
    }

    @objc func rebuildWindows() {
        windows.forEach { $0.close() }
        windows = NSScreen.screens.map(makeWindow)
    }

    func makeWindow(for screen: NSScreen) -> NSWindow {
        let w = NSWindow(contentRect: screen.frame, styleMask: .borderless, backing: .buffered, defer: false)
        w.setFrame(screen.frame, display: false)
        w.level = NSWindow.Level(rawValue: Int(CGWindowLevelForKey(.desktopWindow)))
        w.collectionBehavior = [.canJoinAllSpaces, .stationary, .ignoresCycle, .fullScreenNone]
        w.ignoresMouseEvents = true
        w.isReleasedWhenClosed = false
        w.backgroundColor = .black
        w.hasShadow = false
        w.contentView = EarthViews.shared.make(frame: screen.frame)
        w.orderFront(nil)
        return w
    }

    @objc func pause() { EarthViews.shared.screensAsleep = true }
    @objc func resume() { EarthViews.shared.screensAsleep = false }
    @objc func visibilityChanged() { EarthViews.shared.updatePause() }

    @objc func openSettings() {
        if settingsWindow == nil {
            let w = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 560, height: 860),
                             styleMask: [.titled, .closable, .miniaturizable, .resizable],
                             backing: .buffered, defer: false)
            w.title = "Earth Now"
            w.isReleasedWhenClosed = false
            w.contentView = NSHostingView(rootView: SettingsView())
            w.center()
            w.setFrameAutosaveName("EarthNowSettings")
            settingsWindow = w
        }
        NSApp.activate(ignoringOtherApps: true)
        settingsWindow?.makeKeyAndOrderFront(nil)
    }

    // MARK: Menu bar (rebuilt every time it opens)

    func menuNeedsUpdate(_ m: NSMenu) {
        m.removeAllItems()
        let store = Store.shared
        let settings = NSMenuItem(title: L("Settings…"), action: #selector(openSettings), keyEquivalent: ",")
        settings.target = self
        m.addItem(settings)
        m.addItem(.separator())

        m.addItem(header(L("View")))
        for (i, v) in store.allViews.enumerated() {
            let item = NSMenuItem(title: v.name, action: #selector(pickView(_:)), keyEquivalent: "")
            item.tag = i
            item.target = self
            item.state = store.currentView?.id == v.id ? .on : .off
            m.addItem(item)
            if v.mirrorable == true, store.currentView?.id == v.id {
                for (left, title) in [(true, L("Earth on Left")), (false, L("Earth on Right"))] {
                    let side = NSMenuItem(title: title, action: #selector(pickSide(_:)), keyEquivalent: "")
                    side.tag = left ? 1 : 0
                    side.target = self
                    side.indentationLevel = 1
                    side.state = store.earthLeft == left ? .on : .off
                    m.addItem(side)
                }
            }
        }
        m.addItem(.separator())
        m.addItem(header(L("Motion")))
        for (i, mo) in Motion.allCases.enumerated() {
            let item = NSMenuItem(title: mo.title, action: #selector(pickMotion(_:)), keyEquivalent: "")
            item.tag = i
            item.target = self
            item.state = store.config.motion == mo ? .on : .off
            m.addItem(item)
        }
        m.addItem(.separator())
        let login = NSMenuItem(title: L("Open at Login"), action: #selector(toggleLoginItem), keyEquivalent: "")
        login.target = self
        login.state = SMAppService.mainApp.status == .enabled ? .on : .off
        m.addItem(login)
        let reload = NSMenuItem(title: L("Reload"), action: #selector(rebuildWindows), keyEquivalent: "r")
        reload.target = self
        m.addItem(reload)
        m.addItem(.separator())
        let about = NSMenuItem(title: L("About Earth Now"), action: #selector(showAbout), keyEquivalent: "")
        about.target = self
        m.addItem(about)
        let updates = NSMenuItem(title: L("Check for Updates…"), action: #selector(checkForUpdates), keyEquivalent: "")
        updates.target = self
        m.addItem(updates)
        m.addItem(NSMenuItem(title: L("Quit Earth Now"), action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
    }

    private func header(_ title: String) -> NSMenuItem {
        if #available(macOS 14.0, *) { return NSMenuItem.sectionHeader(title: title) }
        let item = NSMenuItem(title: title, action: nil, keyEquivalent: "")
        item.isEnabled = false
        return item
    }

    @objc func toggleLoginItem() {
        let service = SMAppService.mainApp
        do {
            if service.status == .enabled { try service.unregister() } else { try service.register() }
        } catch {
            let alert = NSAlert()
            alert.messageText = L("Couldn't change the login item")
            alert.informativeText = L("Move Earth Now to your Applications folder and try again. You can also add it under System Settings › General › Login Items.")
            alert.runModal()
        }
    }

    @objc func showAbout() {
        NSApp.activate(ignoringOtherApps: true)
        NSApp.orderFrontStandardAboutPanel(options: [
            .credits: NSAttributedString(string: L("Earth imagery: NASA Earth Observatory. Live clouds: matteason/live-cloud-maps, contains modified EUMETSAT data. 3D: three.js (MIT)."),
                                         attributes: [.font: NSFont.systemFont(ofSize: 11)]),
        ])
    }

    @objc func checkForUpdates() {
        NSWorkspace.shared.open(URL(string: "https://github.com/Hensobo/earth-now/releases/latest")!)
    }

    @objc func pickView(_ s: NSMenuItem) { Store.shared.applyView(Store.shared.allViews[s.tag]) }
    @objc func pickSide(_ s: NSMenuItem) { Store.shared.earthLeft = s.tag == 1 }
    @objc func pickMotion(_ s: NSMenuItem) { Store.shared.config.motion = Motion.allCases[s.tag] }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.accessory)
app.run()
