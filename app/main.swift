// Live Earth – zeigt web/index.html als animierten Desktop-Hintergrund.
// Ein randloses Fenster pro Bildschirm auf Desktop-Ebene (unter den Desktop-Icons),
// klick-durchlässig, auf allen Spaces. Steuerung über das Menüleisten-Symbol und
// ein Einstellungsfenster mit Live-Vorschau.

import AppKit
import Combine
import MapKit
import SwiftUI
import UniformTypeIdentifiers
import WebKit

// MARK: - Konfiguration (wird 1:1 als JSON an die Webseite übergeben)

enum Motion: String, Codable, CaseIterable, Identifiable {
    case orbit, fixed, sun
    var id: String { rawValue }
    var title: String {
        switch self {
        case .orbit: return "Umkreisen"
        case .fixed: return "Über dem Ort"
        case .sun: return "Sonne folgen"
        }
    }
    var help: String {
        switch self {
        case .orbit: return "Die Kamera kreist langsam um die Erde, Tag und Nacht bleiben echt."
        case .fixed: return "Die Kamera steht über dem Ort – du siehst live, wie dort Tag und Nacht wechseln."
        case .sun: return "Die Tag-Nacht-Grenze bleibt im Bild, die Erde dreht sich in Echtzeit darunter weg."
        }
    }
}

enum CloudMode: String, Codable, CaseIterable, Identifiable {
    case live, `static`, off
    var id: String { rawValue }
    var title: String {
        switch self {
        case .live: return "Live"
        case .static: return "Statisch"
        case .off: return "Aus"
        }
    }
}

struct EarthConfig: Codable, Equatable {
    var motion: Motion = .orbit
    var speed: Double = 0.4
    var lat: Double = 51.0
    var lon: Double = 10.0
    var place: String = "Deutschland"
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

/// Eine Ansicht = Kamera-Einstellungen ohne Ort und Bewegung.
struct ViewPreset: Codable, Identifiable, Equatable {
    var id = UUID()
    var name: String
    var symbol: String = "star"
    var zoom: Double, pitch: Double, heading: Double, tilt: Double, fov: Double, x: Double, y: Double
    var builtin = false
    /// Spiegelbar: Erde kann links oder rechts sitzen (optional, damit alte gespeicherte Ansichten lesbar bleiben)
    var mirrorable: Bool? = nil

    static let builtins: [ViewPreset] = [
        .init(name: "Ganze Erde", symbol: "globe.europe.africa", zoom: 0.62, pitch: 0, heading: 0, tilt: 18, fov: 30, x: 0, y: 0, builtin: true),
        .init(name: "Nah dran", symbol: "circle.bottomhalf.filled", zoom: 2.2, pitch: 20, heading: 0, tilt: 0, fov: 30, x: 0, y: -0.35, builtin: true),
        .init(name: "Horizont", symbol: "sunrise", zoom: 4.2, pitch: 66, heading: 0, tilt: 0, fov: 50, x: 0, y: 0, builtin: true),
        .init(name: "Seitlich", symbol: "circle.righthalf.filled", zoom: 1.25, pitch: 0, heading: 0, tilt: 20, fov: 30, x: 0.55, y: 0, builtin: true, mirrorable: true),
        .init(name: "Weit draußen", symbol: "smallcircle.filled.circle", zoom: 0.3, pitch: 0, heading: 0, tilt: 18, fov: 30, x: 0, y: 0, builtin: true),
    ]

    /// Linke Variante: x und Drehung gespiegelt.
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
        .init(name: "Deutschland", lat: 51.0, lon: 10.0),
        .init(name: "Europa", lat: 48.0, lon: 12.0),
        .init(name: "Nordamerika", lat: 40.0, lon: -98.0),
        .init(name: "Südamerika", lat: -15.0, lon: -60.0),
        .init(name: "Afrika", lat: 5.0, lon: 20.0),
        .init(name: "Asien", lat: 30.0, lon: 95.0),
        .init(name: "Australien", lat: -25.0, lon: 134.0),
        .init(name: "Nordpol", lat: 80.0, lon: 0.0),
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
        func load<T: Decodable>(_ key: String, _ fallback: T) -> T {
            guard let data = UserDefaults.standard.data(forKey: key),
                  let v = try? JSONDecoder().decode(T.self, from: data) else { return fallback }
            return v
        }
        config = load("config", EarthConfig())
        customViews = load("customViews", [])
        recentPlaces = load("recentPlaces", [])
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

    /// Bevorzugte Seite für spiegelbare Ansichten (z. B. „Seitlich“)
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

// MARK: - Webseite aus dem App-Bundle über ein eigenes URL-Schema ausliefern
// (file:// erlaubt keine ES-Module; earth://app/... verhält sich wie ein Webserver.)

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

/// Alle Erd-Ansichten (Desktop-Fenster + Vorschau) – bekommen Änderungen live.
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
        web.isInspectable = true
        web.load(URLRequest(url: URL(string: "earth://app/index.html")!))
        views.add(web)
        return web
    }

    func eval(_ js: String) { views.allObjects.forEach { $0.evaluateJavaScript(js) } }

    /// Bildschirme schlafen → alles pausieren
    var screensAsleep = false { didSet { updatePause() } }

    /// Jede Ansicht pausiert, solange ihr Fenster komplett verdeckt oder geschlossen ist
    /// (Vollbild-Apps, geschlossenes Einstellungsfenster, Bildschirme aus).
    func updatePause() {
        for web in views.allObjects {
            let visible = web.window.map { $0.isVisible && $0.occlusionState.contains(.visible) } ?? false
            web.evaluateJavaScript("window.setPaused && setPaused(\(screensAsleep || !visible))")
        }
    }
}

// MARK: - Ortssuche (Apple Karten)

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

// MARK: - Einstellungsfenster

struct EarthPreview: NSViewRepresentable {
    func makeNSView(context: Context) -> WKWebView { EarthViews.shared.make(frame: .zero) }
    func updateNSView(_ v: WKWebView, context: Context) {}
}

// @State ist ein Makro und braucht Xcode – mit den Command Line Tools daher ObservableObject
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
                    Text("Vorschau – Änderungen gelten sofort auch für den Desktop")
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

    // Ansicht
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
                                Button("Ansicht löschen", role: .destructive) {
                                    store.customViews.removeAll { $0.id == v.id }
                                }
                            }
                        }
                    }
                }
                .padding(.vertical, 2)
            }
            if store.currentView?.mirrorable == true {
                Picker("Erde sitzt", selection: $store.earthLeft) {
                    Label("Links", systemImage: "circle.lefthalf.filled").tag(true)
                    Label("Rechts", systemImage: "circle.righthalf.filled").tag(false)
                }
                .pickerStyle(.segmented)
            }
            HStack {
                Text(store.currentView == nil ? "Eigene Einstellung (noch nicht gespeichert)"
                                              : "Eigene Ansichten löschst du per Rechtsklick")
                    .font(.caption).foregroundStyle(.secondary)
                Spacer()
                Button("Als Ansicht speichern …") { ui.newViewName = ""; ui.naming = true }
                    .disabled(store.currentView != nil)
            }
        } header: { Text("Ansicht") }
        .alert("Ansicht speichern", isPresented: $ui.naming) {
            TextField("Name", text: $ui.newViewName)
            Button("Speichern") {
                let name = ui.newViewName.trimmingCharacters(in: .whitespaces)
                store.saveCurrentView(named: name.isEmpty ? "Meine Ansicht" : name)
            }
            Button("Abbrechen", role: .cancel) {}
        } message: { Text("Speichert Zoom, Neigung und Ausschnitt als eigene Ansicht.") }
    }

    // Ort & Bewegung
    private var placeSection: some View {
        Section {
            LabeledContent("Aktueller Ort") {
                Text("\(store.config.place)  ·  \(coord(store.config.lat, "N", "S")), \(coord(store.config.lon, "O", "W"))")
                    .foregroundStyle(.secondary)
            }
            TextField("Ort suchen", text: $search.query, prompt: Text("Ort suchen – Stadt, Land, Adresse …"))
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
            Picker("Bewegung", selection: $store.config.motion) {
                ForEach(Motion.allCases) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)
            Text(store.config.motion.help).font(.caption).foregroundStyle(.secondary)
            if store.config.motion == .orbit {
                slider("Tempo", $store.config.speed, 0.02...3, log: true,
                       format: { String(format: "%.0f min / Runde", 360 / $0 / 60) })
            }
        } header: { Text("Ort & Bewegung") }
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

    // Kamera / Zoom
    private var cameraSection: some View {
        Section {
            slider("Zoom", $store.config.zoom, 0.15...8, log: true, format: { String(format: "%.2f×", $0) })
            slider("Neigung", $store.config.pitch, 0...85, format: { "\(Int($0))°" })
            slider("Blickrichtung", $store.config.heading, -180...180, format: { "\(Int($0))°" })
            slider("Drehung", $store.config.tilt, -60...60, format: { "\(Int($0))°" })
            slider("Brennweite", $store.config.fov, 12...75, format: { "\(Int($0))°" })
            slider("Horizontal", $store.config.x, -1.5...1.5, format: { String(format: "%+.2f", $0) })
            slider("Vertikal", $store.config.y, -1.5...1.5, format: { String(format: "%+.2f", $0) })
        } header: { Text("Zoom & Ausschnitt") }
    }

    private var displaySection: some View {
        Section {
            Picker("Wolken", selection: $store.config.clouds) {
                ForEach(CloudMode.allCases) { Text($0.title).tag($0) }
            }
            .pickerStyle(.segmented)
            Toggle("Uhrzeit & Sonnenstand einblenden", isOn: $store.config.hud)
            Toggle("Maximale Qualität (60 fps, volle Auflösung – braucht mehr Akku)", isOn: Binding(
                get: { store.config.fps == 60 }, set: { store.config.fps = $0 ? 60 : 30 }))
        } header: { Text("Darstellung") } footer: {
            // Quellenangaben (EUMETSAT verlangt den Hinweis bei Nutzung der Wolkendaten)
            Text("Erdbilder: NASA Blue Marble & Black Marble · Live-Wolken: matteason/live-cloud-maps, contains modified EUMETSAT data · 3D: three.js")
                .font(.caption2).foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func slider(_ title: String, _ value: Binding<Double>, _ range: ClosedRange<Double>,
                        log: Bool = false, format: @escaping (Double) -> String) -> some View {
        // Logarithmischer Regler (Zoom, Tempo): feine Kontrolle bei kleinen Werten
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
        statusItem.button?.image = NSImage(systemSymbolName: "globe.europe.africa.fill", accessibilityDescription: "Live Earth")
        let menu = NSMenu()
        menu.delegate = self
        statusItem.menu = menu

        rebuildWindows()
        NotificationCenter.default.addObserver(self, selector: #selector(rebuildWindows),
            name: NSApplication.didChangeScreenParametersNotification, object: nil)
        // Rendering pausieren, wenn die Bildschirme schlafen (spart Akku)
        for name in [NSWindow.didChangeOcclusionStateNotification, NSWindow.willCloseNotification] {
            NotificationCenter.default.addObserver(self, selector: #selector(visibilityChanged), name: name, object: nil)
        }
        let ws = NSWorkspace.shared.notificationCenter
        ws.addObserver(self, selector: #selector(pause), name: NSWorkspace.screensDidSleepNotification, object: nil)
        ws.addObserver(self, selector: #selector(resume), name: NSWorkspace.screensDidWakeNotification, object: nil)

        let env = ProcessInfo.processInfo.environment
        if env["LIVEEARTH_SETTINGS"] != nil { openSettings() }
        // Debug: Bild des Einstellungsfensters (ohne WebGL-Vorschau) speichern
        if let out = env["LIVEEARTH_SETTINGS_SNAPSHOT"] {
            DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
                guard let v = self.settingsWindow?.contentView,
                      let rep = v.bitmapImageRepForCachingDisplay(in: v.bounds) else { return }
                v.cacheDisplay(in: v.bounds, to: rep)
                try? rep.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: out))
            }
        }
        // Debug: LIVEEARTH_SNAPSHOT=/pfad.png speichert nach 8 s ein Bild des Desktops
        if let out = env["LIVEEARTH_SNAPSHOT"] {
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
            w.title = "Live Earth"
            w.isReleasedWhenClosed = false
            w.contentView = NSHostingView(rootView: SettingsView())
            w.center()
            w.setFrameAutosaveName("LiveEarthSettings")
            settingsWindow = w
        }
        NSApp.activate(ignoringOtherApps: true)
        settingsWindow?.makeKeyAndOrderFront(nil)
    }

    // MARK: Menüleiste (wird bei jedem Öffnen neu aufgebaut)

    func menuNeedsUpdate(_ m: NSMenu) {
        m.removeAllItems()
        let store = Store.shared
        let settings = NSMenuItem(title: "Einstellungen …", action: #selector(openSettings), keyEquivalent: ",")
        settings.target = self
        m.addItem(settings)
        m.addItem(.separator())

        m.addItem(NSMenuItem.sectionHeader(title: "Ansicht"))
        for (i, v) in store.allViews.enumerated() {
            let item = NSMenuItem(title: v.name, action: #selector(pickView(_:)), keyEquivalent: "")
            item.tag = i
            item.target = self
            item.state = store.currentView?.id == v.id ? .on : .off
            m.addItem(item)
            if v.mirrorable == true, store.currentView?.id == v.id {
                for (left, title) in [(true, "Erde links"), (false, "Erde rechts")] {
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
        m.addItem(NSMenuItem.sectionHeader(title: "Bewegung"))
        for (i, mo) in Motion.allCases.enumerated() {
            let item = NSMenuItem(title: mo.title, action: #selector(pickMotion(_:)), keyEquivalent: "")
            item.tag = i
            item.target = self
            item.state = store.config.motion == mo ? .on : .off
            m.addItem(item)
        }
        m.addItem(.separator())
        let reload = NSMenuItem(title: "Neu laden", action: #selector(rebuildWindows), keyEquivalent: "r")
        reload.target = self
        m.addItem(reload)
        m.addItem(NSMenuItem(title: "Beenden", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
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
