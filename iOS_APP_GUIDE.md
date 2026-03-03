# ShareTracker iOS App

A native iOS application for investment portfolio tracking with capital gains reporting. This document outlines the architecture, structure, and implementation for an iPhone app that mirrors the functionality of the web client.

## Stack

| Layer | Technology |
|---|---|
| UI Framework | SwiftUI, UIKit |
| Architecture | MVVM + Combine |
| Networking | URLSession, Alamofire (optional) |
| Local Storage | CoreData, UserDefaults |
| Authentication | Clerk iOS SDK |
| Async Operations | Combine, async/await |
| Testing | XCTest, @testable imports |
| Dependency Injection | Factory pattern, Swinject (optional) |

---

## Project Structure

```
ShareTracker-iOS/
├── ShareTracker.xcodeproj
├── ShareTracker/
│   ├── App/
│   │   ├── ShareTrackerApp.swift
│   │   └── AppDelegate.swift
│   ├── Authentication/
│   │   ├── Models/
│   │   │   ├── User.swift
│   │   │   └── AuthToken.swift
│   │   ├── ViewModels/
│   │   │   ├── SignInViewModel.swift
│   │   │   ├── SignUpViewModel.swift
│   │   │   └── AuthenticationViewModel.swift
│   │   ├── Views/
│   │   │   ├── SignInView.swift
│   │   │   ├── SignUpView.swift
│   │   │   └── AuthenticationContainer.swift
│   │   └── Services/
│   │       └── AuthenticationService.swift
│   ├── Portfolio/
│   │   ├── Models/
│   │   │   ├── Position.swift
│   │   │   ├── Trade.swift
│   │   │   ├── Asset.swift
│   │   │   └── PortfolioSummary.swift
│   │   ├── ViewModels/
│   │   │   ├── PortfolioViewModel.swift
│   │   │   ├── PositionDetailViewModel.swift
│   │   │   └── TradingViewModel.swift
│   │   ├── Views/
│   │   │   ├── PortfolioView.swift
│   │   │   ├── PositionDetailView.swift
│   │   │   ├── AddTradeView.swift
│   │   │   ├── EditTradeView.swift
│   │   │   └── PortfolioSummaryCard.swift
│   │   └── Services/
│   │       ├── TradesService.swift
│   │       └── PortfolioService.swift
│   ├── Quotes/
│   │   ├── Models/
│   │   │   ├── Quote.swift
│   │   │   ├── CryptoQuote.swift
│   │   │   └── ForexQuote.swift
│   │   ├── ViewModels/
│   │   │   ├── QuotesViewModel.swift
│   │   │   ├── CryptoQuotesViewModel.swift
│   │   │   └── ForexQuotesViewModel.swift
│   │   ├── Views/
│   │   │   ├── QuotesView.swift
│   │   │   ├── CryptoQuotesView.swift
│   │   │   ├── ForexQuotesView.swift
│   │   │   └── QuoteDetailView.swift
│   │   └── Services/
│   │       ├── CryptoQuotesService.swift
│   │       └── ForexQuotesService.swift
│   ├── Reports/
│   │   ├── Models/
│   │   │   ├── Report.swift
│   │   │   ├── CapitalGain.swift
│   │   │   └── ReportSummary.swift
│   │   ├── ViewModels/
│   │   │   ├── ReportsViewModel.swift
│   │   │   └── ReportDetailViewModel.swift
│   │   ├── Views/
│   │   │   ├── ReportsView.swift
│   │   │   ├── ReportDetailView.swift
│   │   │   └── ReportExportView.swift
│   │   └── Services/
│   │       └── ReportsService.swift
│   ├── Profile/
│   │   ├── Models/
│   │   │   └── UserProfile.swift
│   │   ├── ViewModels/
│   │   │   ├── ProfileViewModel.swift
│   │   │   └── CompleteProfileViewModel.swift
│   │   ├── Views/
│   │   │   ├── ProfileView.swift
│   │   │   ├── EditProfileView.swift
│   │   │   └── CompleteProfileView.swift
│   │   └── Services/
│   │       └── ProfileService.swift
│   ├── Core/
│   │   ├── Networking/
│   │   │   ├── APIClient.swift
│   │   │   ├── APIEndpoint.swift
│   │   │   ├── NetworkError.swift
│   │   │   └── URLSessionConfiguration.swift
│   │   ├── Extensions/
│   │   │   ├── Date+Extensions.swift
│   │   │   ├── Double+Extensions.swift
│   │   │   ├── String+Extensions.swift
│   │   │   └── View+Extensions.swift
│   │   ├── Utilities/
│   │   │   ├── CurrencyFormatter.swift
│   │   │   ├── DateFormatter.swift
│   │   │   └── ValidationHelper.swift
│   │   ├── Modifiers/
│   │   │   ├── TextFieldModifier.swift
│   │   │   ├── ButtonModifier.swift
│   │   │   └── CardModifier.swift
│   │   └── Constants/
│   │       ├── APIConstants.swift
│   │       ├── AppConstants.swift
│   │       └── LocalizedStrings.swift
│   └── Persistence/
│       ├── CoreDataManager.swift
│       ├── KeychainManager.swift
│       └── UserDefaultsManager.swift
└── ShareTrackerTests/
    ├── Authentication/
    ├── Portfolio/
    ├── Services/
    └── ViewModels/
```

---

## Core Models

### Authentication Models

```swift
// Models/User.swift
import Foundation

struct User: Codable, Identifiable {
    let id: String
    let email: String
    let firstName: String?
    let lastName: String?
    let profileImageURL: URL?
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case email
        case firstName = "first_name"
        case lastName = "last_name"
        case profileImageURL = "profile_image_url"
        case createdAt = "created_at"
    }
}

struct AuthToken: Codable {
    let accessToken: String
    let tokenType: String = "Bearer"
    let expiresIn: Int
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case expiresIn = "expires_in"
    }
}
```

### Portfolio Models

```swift
// Models/Trade.swift
import Foundation

struct Trade: Codable, Identifiable {
    let id: String
    let symbol: String
    let assetType: AssetType  // shares, crypto, gold, bonds, property
    let quantity: Double
    let purchasePrice: Double
    let purchaseDate: Date
    let fees: Double?
    let notes: String?
    let currency: String
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case symbol
        case assetType = "asset_type"
        case quantity
        case purchasePrice = "purchase_price"
        case purchaseDate = "purchase_date"
        case fees
        case notes
        case currency
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

enum AssetType: String, Codable, CaseIterable {
    case shares
    case crypto
    case gold
    case bonds
    case property
}

struct Position: Codable, Identifiable {
    let id: String
    let symbol: String
    let assetType: AssetType
    let quantity: Double
    let averageCost: Double
    let currentPrice: Double
    let totalValue: Double
    let gainLoss: Double
    let gainLossPercent: Double
    let currency: String
    
    var isGain: Bool {
        gainLoss >= 0
    }
}

struct PortfolioSummary: Codable {
    let totalValue: Double
    let totalInvested: Double
    let totalGainLoss: Double
    let gainLossPercent: Double
    let positions: [Position]
    let lastUpdated: Date
    
    var isGain: Bool {
        totalGainLoss >= 0
    }
}
```

### Quotes Models

```swift
// Models/CryptoQuote.swift
import Foundation

struct CryptoQuote: Codable, Identifiable {
    let id: String
    let symbol: String
    let name: String
    let currentPrice: Double
    let change24h: Double
    let changePercent24h: Double
    let marketCap: Double?
    let volume24h: Double?
    let high24h: Double?
    let low24h: Double?
    let lastUpdated: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case symbol
        case name
        case currentPrice = "current_price"
        case change24h = "change_24h"
        case changePercent24h = "change_percent_24h"
        case marketCap = "market_cap"
        case volume24h = "volume_24h"
        case high24h = "high_24h"
        case low24h = "low_24h"
        case lastUpdated = "last_updated"
    }
}

struct ForexQuote: Codable, Identifiable {
    let id: String
    let fromCurrency: String
    let toCurrency: String
    let rate: Double
    let bid: Double?
    let ask: Double?
    let timestamp: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case fromCurrency = "from_currency"
        case toCurrency = "to_currency"
        case rate
        case bid
        case ask
        case timestamp
    }
}
```

### Reports Models

```swift
// Models/Report.swift
import Foundation

struct CapitalGain: Codable, Identifiable {
    let id: String
    let symbol: String
    let assetType: AssetType
    let quantity: Double
    let purchasePrice: Double
    let salePrice: Double
    let purchaseDate: Date
    let saleDate: Date
    let gainLoss: Double
    let holdingPeriod: String  // short-term or long-term
    let currency: String
}

struct Report: Codable, Identifiable {
    let id: String
    let period: String  // "2024-Q1", "2024", etc.
    let totalGains: Double
    let totalLosses: Double
    let netCapitalGain: Double
    let capitalGains: [CapitalGain]
    let generatedAt: Date
}

struct ReportSummary: Codable {
    let year: Int
    let totalCapitalGains: Double
    let totalCapitalLosses: Double
    let netCapitalGain: Double
    let shortTermGains: Double
    let longTermGains: Double
}
```

---

## Core Services

### API Client

```swift
// Core/Networking/APIClient.swift
import Foundation
import Combine

class APIClient {
    static let shared = APIClient()
    
    private let session: URLSession
    private let baseURL: URL
    
    init(baseURL: URL = URL(string: ProcessInfo.processInfo.environment["API_URL"] ?? "http://localhost:5000/api")!) {
        self.baseURL = baseURL
        var config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        self.session = URLSession(configuration: config)
    }
    
    func request<T: Decodable>(
        endpoint: APIEndpoint,
        token: String? = nil
    ) -> AnyPublisher<T, NetworkError> {
        guard var urlComponents = URLComponents(url: baseURL.appendingPathComponent(endpoint.path), resolvingAgainstBaseURL: true) else {
            return Fail(error: .invalidURL).eraseToAnyPublisher()
        }
        
        if !endpoint.queryParameters.isEmpty {
            urlComponents.queryItems = endpoint.queryParameters.map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        
        guard let url = urlComponents.url else {
            return Fail(error: .invalidURL).eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        request.allHTTPHeaderFields = endpoint.headers
        
        if let token = token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = endpoint.body {
            request.httpBody = try? JSONEncoder().encode(body)
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        
        return session.dataTaskPublisher(for: request)
            .mapError { error -> NetworkError in
                .requestFailed(error)
            }
            .tryMap { data, response -> Data in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw NetworkError.invalidResponse
                }
                
                if !(200...299).contains(httpResponse.statusCode) {
                    throw NetworkError.httpError(statusCode: httpResponse.statusCode)
                }
                
                return data
            }
            .mapError { error -> NetworkError in
                if let networkError = error as? NetworkError {
                    return networkError
                }
                return .decodingError
            }
            .decode(type: T.self, decoder: JSONDecoder())
            .mapError { _ in .decodingError }
            .eraseToAnyPublisher()
    }
}

enum NetworkError: LocalizedError {
    case invalidURL
    case requestFailed(Error)
    case invalidResponse
    case httpError(statusCode: Int)
    case decodingError
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "The URL is invalid."
        case .requestFailed(let error):
            return "Network request failed: \(error.localizedDescription)"
        case .invalidResponse:
            return "Invalid response from server."
        case .httpError(let statusCode):
            return "HTTP Error \(statusCode)"
        case .decodingError:
            return "Failed to decode response."
        }
    }
}
```

### Authentication Service

```swift
// Authentication/Services/AuthenticationService.swift
import Foundation
import Combine

class AuthenticationService: ObservableObject {
    @Published var user: User?
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var error: Error?
    
    private let apiClient = APIClient.shared
    private let keychain = KeychainManager.shared
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        restoreSession()
    }
    
    func signIn(email: String, password: String) {
        isLoading = true
        error = nil
        
        let endpoint = APIEndpoint.signIn(email: email, password: password)
        
        apiClient.request(endpoint: endpoint)
            .sink { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.error = error
                }
            } receiveValue: { [weak self] (response: AuthResponse) in
                self?.keychain.save(token: response.token.accessToken)
                self?.user = response.user
                self?.isAuthenticated = true
            }
            .store(in: &cancellables)
    }
    
    func signUp(email: String, password: String, firstName: String, lastName: String) {
        isLoading = true
        error = nil
        
        let endpoint = APIEndpoint.signUp(
            email: email,
            password: password,
            firstName: firstName,
            lastName: lastName
        )
        
        apiClient.request(endpoint: endpoint)
            .sink { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.error = error
                }
            } receiveValue: { [weak self] (response: AuthResponse) in
                self?.keychain.save(token: response.token.accessToken)
                self?.user = response.user
                self?.isAuthenticated = true
            }
            .store(in: &cancellables)
    }
    
    func signOut() {
        keychain.delete(token: nil)
        user = nil
        isAuthenticated = false
        cancellables.removeAll()
    }
    
    private func restoreSession() {
        if let token = keychain.retrieve(token: nil) {
            isAuthenticated = true
            fetchCurrentUser(token: token)
        }
    }
    
    private func fetchCurrentUser(token: String) {
        let endpoint = APIEndpoint.getCurrentUser
        
        apiClient.request(endpoint: endpoint, token: token)
            .sink { completion in
                if case .failure = completion {
                    self.signOut()
                }
            } receiveValue: { [weak self] (response: User) in
                self?.user = response
                self?.isAuthenticated = true
            }
            .store(in: &cancellables)
    }
}

struct AuthResponse: Codable {
    let user: User
    let token: AuthToken
}
```

### Portfolio Service

```swift
// Portfolio/Services/PortfolioService.swift
import Foundation
import Combine

class PortfolioService {
    static let shared = PortfolioService()
    
    private let apiClient = APIClient.shared
    private let authService: AuthenticationService
    
    init(authService: AuthenticationService = AuthenticationService()) {
        self.authService = authService
    }
    
    func fetchPortfolioSummary() -> AnyPublisher<PortfolioSummary, NetworkError> {
        guard let token = getAuthToken() else {
            return Fail(error: .requestFailed(NSError(domain: "Auth", code: -1))).eraseToAnyPublisher()
        }
        
        let endpoint = APIEndpoint.getPortfolio
        return apiClient.request(endpoint: endpoint, token: token)
    }
    
    func fetchPositions() -> AnyPublisher<[Position], NetworkError> {
        guard let token = getAuthToken() else {
            return Fail(error: .requestFailed(NSError(domain: "Auth", code: -1))).eraseToAnyPublisher()
        }
        
        let endpoint = APIEndpoint.getPositions
        return apiClient.request(endpoint: endpoint, token: token)
    }
    
    func addTrade(_ trade: Trade) -> AnyPublisher<Trade, NetworkError> {
        guard let token = getAuthToken() else {
            return Fail(error: .requestFailed(NSError(domain: "Auth", code: -1))).eraseToAnyPublisher()
        }
        
        let endpoint = APIEndpoint.createTrade(trade: trade)
        return apiClient.request(endpoint: endpoint, token: token)
    }
    
    func updateTrade(_ trade: Trade) -> AnyPublisher<Trade, NetworkError> {
        guard let token = getAuthToken() else {
            return Fail(error: .requestFailed(NSError(domain: "Auth", code: -1))).eraseToAnyPublisher()
        }
        
        let endpoint = APIEndpoint.updateTrade(id: trade.id, trade: trade)
        return apiClient.request(endpoint: endpoint, token: token)
    }
    
    func deleteTrade(id: String) -> AnyPublisher<Void, NetworkError> {
        guard let token = getAuthToken() else {
            return Fail(error: .requestFailed(NSError(domain: "Auth", code: -1))).eraseToAnyPublisher()
        }
        
        let endpoint = APIEndpoint.deleteTrade(id: id)
        return apiClient.request(endpoint: endpoint, token: token)
            .map { (_: EmptyResponse) in () }
            .eraseToAnyPublisher()
    }
    
    private func getAuthToken() -> String? {
        KeychainManager.shared.retrieve(token: nil)
    }
}
```

### Quotes Service

```swift
// Quotes/Services/CryptoQuotesService.swift
import Foundation
import Combine

class CryptoQuotesService {
    static let shared = CryptoQuotesService()
    
    private let apiClient = APIClient.shared
    private var cancellables = Set<AnyCancellable>()
    
    func fetchCryptoQuotes(symbols: [String]) -> AnyPublisher<[CryptoQuote], NetworkError> {
        let endpoint = APIEndpoint.getCryptoQuotes(symbols: symbols)
        return apiClient.request(endpoint: endpoint)
    }
    
    func fetchCryptoQuote(symbol: String) -> AnyPublisher<CryptoQuote, NetworkError> {
        let endpoint = APIEndpoint.getCryptoQuote(symbol: symbol)
        return apiClient.request(endpoint: endpoint)
    }
    
    func subscribeToQuoteUpdates(symbols: [String]) -> AnyPublisher<CryptoQuote, Never> {
        // Implement WebSocket connection or polling for real-time updates
        Timer.publish(every: 5.0, on: .main, in: .common)
            .autoconnect()
            .flatMap { _ in
                self.fetchCryptoQuotes(symbols: symbols)
                    .replaceError(with: [])
            }
            .flatMap { quotes in
                Publishers.Sequence(sequence: quotes)
            }
            .eraseToAnyPublisher()
    }
}
```

### Reports Service

```swift
// Reports/Services/ReportsService.swift
import Foundation
import Combine

class ReportsService {
    static let shared = ReportsService()
    
    private let apiClient = APIClient.shared
    private let authService: AuthenticationService
    
    init(authService: AuthenticationService = AuthenticationService()) {
        self.authService = authService
    }
    
    func generateReport(period: String) -> AnyPublisher<Report, NetworkError> {
        guard let token = getAuthToken() else {
            return Fail(error: .requestFailed(NSError(domain: "Auth", code: -1))).eraseToAnyPublisher()
        }
        
        let endpoint = APIEndpoint.generateReport(period: period)
        return apiClient.request(endpoint: endpoint, token: token)
    }
    
    func fetchReports() -> AnyPublisher<[Report], NetworkError> {
        guard let token = getAuthToken() else {
            return Fail(error: .requestFailed(NSError(domain: "Auth", code: -1))).eraseToAnyPublisher()
        }
        
        let endpoint = APIEndpoint.getReports
        return apiClient.request(endpoint: endpoint, token: token)
    }
    
    func exportReport(id: String, format: ExportFormat) -> AnyPublisher<URL, NetworkError> {
        guard let token = getAuthToken() else {
            return Fail(error: .requestFailed(NSError(domain: "Auth", code: -1))).eraseToAnyPublisher()
        }
        
        let endpoint = APIEndpoint.exportReport(id: id, format: format.rawValue)
        return apiClient.request(endpoint: endpoint, token: token)
            .map { (response: ExportResponse) -> URL in
                URL(string: response.downloadURL) ?? URL(fileURLWithPath: "")
            }
            .eraseToAnyPublisher()
    }
    
    enum ExportFormat: String {
        case pdf
        case csv
        case xlsx
    }
    
    private func getAuthToken() -> String? {
        KeychainManager.shared.retrieve(token: nil)
    }
}

struct ExportResponse: Codable {
    let downloadURL: String
    
    enum CodingKeys: String, CodingKey {
        case downloadURL = "download_url"
    }
}
```

---

## Views

### Portfolio View

```swift
// Portfolio/Views/PortfolioView.swift
import SwiftUI

struct PortfolioView: View {
    @StateObject private var viewModel = PortfolioViewModel()
    @State private var showAddTrade = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if viewModel.isLoading {
                    ProgressView()
                        .frame(maxHeight: .infinity)
                } else if let summary = viewModel.portfolioSummary {
                    List {
                        Section {
                            PortfolioSummaryCard(summary: summary)
                                .listRowInsets(EdgeInsets())
                                .listRowSeparator(.hidden)
                        }
                        
                        Section("Positions") {
                            ForEach(summary.positions) { position in
                                NavigationLink(destination: PositionDetailView(position: position)) {
                                    PositionRow(position: position)
                                }
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                } else if let error = viewModel.error {
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 48))
                            .foregroundColor(.red)
                        Text("Error Loading Portfolio")
                            .font(.headline)
                        Text(error.localizedDescription)
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Button(action: { viewModel.refresh() }) {
                            Text("Try Again")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(8)
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Portfolio")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { showAddTrade = true }) {
                        Image(systemName: "plus")
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: { viewModel.refresh() }) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .sheet(isPresented: $showAddTrade) {
                AddTradeView(isPresented: $showAddTrade) { trade in
                    viewModel.addTrade(trade)
                }
            }
            .onAppear {
                viewModel.refresh()
            }
        }
    }
}

struct PortfolioSummaryCard: View {
    let summary: PortfolioSummary
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Total Value")
                .font(.caption)
                .foregroundColor(.secondary)
            Text(CurrencyFormatter.format(summary.totalValue))
                .font(.title2)
                .fontWeight(.bold)
            
            Divider()
            
            HStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Invested")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text(CurrencyFormatter.format(summary.totalInvested))
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Gain/Loss")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    HStack(spacing: 4) {
                        Image(systemName: summary.isGain ? "arrow.up" : "arrow.down")
                            .font(.caption2)
                        Text(CurrencyFormatter.format(summary.totalGainLoss))
                            .font(.subheadline)
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(summary.isGain ? .green : .red)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct PositionRow: View {
    let position: Position
    
    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(position.symbol)
                    .font(.headline)
                Text(position.assetType.rawValue.capitalized)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text(CurrencyFormatter.format(position.totalValue))
                    .font(.headline)
                HStack(spacing: 4) {
                    Image(systemName: position.isGain ? "arrow.up" : "arrow.down")
                        .font(.caption2)
                    Text("\(String(format: "%.2f", position.gainLossPercent))%")
                        .font(.caption)
                }
                .foregroundColor(position.isGain ? .green : .red)
            }
        }
    }
}

#Preview {
    PortfolioView()
}
```

### Add Trade View

```swift
// Portfolio/Views/AddTradeView.swift
import SwiftUI

struct AddTradeView: View {
    @Binding var isPresented: Bool
    @StateObject private var viewModel = AddTradeViewModel()
    
    let onSave: (Trade) -> Void
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Asset Details") {
                    Picker("Asset Type", selection: $viewModel.assetType) {
                        ForEach(AssetType.allCases, id: \.self) { type in
                            Text(type.rawValue.capitalized).tag(type)
                        }
                    }
                    
                    TextField("Symbol", text: $viewModel.symbol)
                        .textInputAutocapitalization(.characters)
                    
                    TextField("Quantity", value: $viewModel.quantity, format: .number)
                        .keyboardType(.decimalPad)
                    
                    TextField("Purchase Price", value: $viewModel.purchasePrice, format: .currency(code: "USD"))
                        .keyboardType(.decimalPad)
                    
                    DatePicker("Purchase Date", selection: $viewModel.purchaseDate, displayedComponents: .date)
                    
                    TextField("Fees (Optional)", value: $viewModel.fees, format: .number)
                        .keyboardType(.decimalPad)
                }
                
                Section("Notes") {
                    TextEditor(text: $viewModel.notes)
                        .frame(minHeight: 100)
                }
            }
            .navigationTitle("Add Trade")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        isPresented = false
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        viewModel.saveTrade { trade in
                            onSave(trade)
                            isPresented = false
                        }
                    }
                    .disabled(!viewModel.isValid)
                }
            }
        }
    }
}

#Preview {
    AddTradeView(isPresented: .constant(true)) { _ in }
}
```

### Reports View

```swift
// Reports/Views/ReportsView.swift
import SwiftUI

struct ReportsView: View {
    @StateObject private var viewModel = ReportsViewModel()
    @State private var selectedPeriod = ""
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                if viewModel.isLoading {
                    ProgressView()
                } else if let reports = viewModel.reports, !reports.isEmpty {
                    List {
                        ForEach(reports) { report in
                            NavigationLink(destination: ReportDetailView(report: report)) {
                                ReportRow(report: report)
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                } else {
                    VStack(spacing: 16) {
                        Image(systemName: "chart.bar")
                            .font(.system(size: 48))
                            .foregroundColor(.gray)
                        Text("No Reports Generated")
                            .font(.headline)
                        Button(action: { viewModel.generateNewReport() }) {
                            Text("Generate Report")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(8)
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Reports")
            .onAppear {
                viewModel.refresh()
            }
        }
    }
}

struct ReportRow: View {
    let report: Report
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(report.period)
                .font(.headline)
            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Net Capital Gain")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text(CurrencyFormatter.format(report.netCapitalGain))
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
                
                Spacer()
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Gains")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text(CurrencyFormatter.format(report.totalGains))
                        .font(.subheadline)
                        .foregroundColor(.green)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Losses")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text(CurrencyFormatter.format(report.totalLosses))
                        .font(.subheadline)
                        .foregroundColor(.red)
                }
            }
        }
    }
}

#Preview {
    ReportsView()
}
```

### Crypto Quotes View

```swift
// Quotes/Views/CryptoQuotesView.swift
import SwiftUI

struct CryptoQuotesView: View {
    @StateObject private var viewModel = CryptoQuotesViewModel()
    @State private var searchText = ""
    
    var filteredQuotes: [CryptoQuote] {
        if searchText.isEmpty {
            return viewModel.quotes
        }
        return viewModel.quotes.filter { quote in
            quote.symbol.localizedCaseInsensitiveContains(searchText) ||
            quote.name.localizedCaseInsensitiveContains(searchText)
        }
    }
    
    var body: some View {
        NavigationStack {
            VStack {
                SearchBar(text: $searchText, placeholder: "Search crypto...")
                
                if viewModel.isLoading {
                    ProgressView()
                } else {
                    List(filteredQuotes) { quote in
                        NavigationLink(destination: CryptoDetailView(quote: quote)) {
                            CryptoQuoteRow(quote: quote)
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Crypto Quotes")
            .onAppear {
                viewModel.refresh()
            }
            .onReceive(Timer.publish(every: 60, on: .main, in: .common).autoconnect()) { _ in
                viewModel.refresh()
            }
        }
    }
}

struct CryptoQuoteRow: View {
    let quote: CryptoQuote
    
    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(quote.symbol)
                    .font(.headline)
                Text(quote.name)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text(CurrencyFormatter.format(quote.currentPrice))
                    .font(.headline)
                HStack(spacing: 4) {
                    Image(systemName: quote.change24h >= 0 ? "arrow.up" : "arrow.down")
                        .font(.caption2)
                    Text("\(String(format: "%.2f", quote.changePercent24h))%")
                        .font(.caption)
                }
                .foregroundColor(quote.change24h >= 0 ? .green : .red)
            }
        }
    }
}

struct SearchBar: View {
    @Binding var text: String
    let placeholder: String
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.gray)
            
            TextField(placeholder, text: $text)
                .textInputAutocapitalization(.never)
                .disableAutocorrection(true)
            
            if !text.isEmpty {
                Button(action: { text = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                }
            }
        }
        .padding(8)
        .background(Color(.systemGray6))
        .cornerRadius(8)
        .padding(.horizontal)
        .padding(.vertical, 8)
    }
}

#Preview {
    CryptoQuotesView()
}
```

---

## ViewModels

### Portfolio ViewModel

```swift
// Portfolio/ViewModels/PortfolioViewModel.swift
import Foundation
import Combine

class PortfolioViewModel: ObservableObject {
    @Published var portfolioSummary: PortfolioSummary?
    @Published var isLoading = false
    @Published var error: Error?
    
    private let portfolioService = PortfolioService.shared
    private var cancellables = Set<AnyCancellable>()
    
    func refresh() {
        isLoading = true
        error = nil
        
        portfolioService.fetchPortfolioSummary()
            .sink { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.error = error
                }
            } receiveValue: { [weak self] summary in
                self?.portfolioSummary = summary
            }
            .store(in: &cancellables)
    }
    
    func addTrade(_ trade: Trade) {
        portfolioService.addTrade(trade)
            .sink { [weak self] completion in
                if case .failure(let error) = completion {
                    self?.error = error
                }
            } receiveValue: { [weak self] _ in
                self?.refresh()
            }
            .store(in: &cancellables)
    }
}
```

### Reports ViewModel

```swift
// Reports/ViewModels/ReportsViewModel.swift
import Foundation
import Combine

class ReportsViewModel: ObservableObject {
    @Published var reports: [Report]?
    @Published var isLoading = false
    @Published var error: Error?
    @Published var selectedPeriod = ""
    
    private let reportsService = ReportsService.shared
    private var cancellables = Set<AnyCancellable>()
    
    func refresh() {
        isLoading = true
        error = nil
        
        reportsService.fetchReports()
            .sink { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.error = error
                }
            } receiveValue: { [weak self] reports in
                self?.reports = reports
            }
            .store(in: &cancellables)
    }
    
    func generateNewReport() {
        let currentYear = Calendar.current.component(.year, from: Date())
        let period = "\(currentYear)"
        
        isLoading = true
        error = nil
        
        reportsService.generateReport(period: period)
            .sink { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.error = error
                }
            } receiveValue: { [weak self] _ in
                self?.refresh()
            }
            .store(in: &cancellables)
    }
}
```

---

## Persistence

### Keychain Manager

```swift
// Persistence/KeychainManager.swift
import Foundation

class KeychainManager {
    static let shared = KeychainManager()
    
    private let service = "com.sharetracker.ios"
    
    func save(token: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "authToken",
            kSecValueData as String: token.data(using: .utf8)!
        ]
        
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
    
    func retrieve(token: String?) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "authToken",
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        SecItemCopyMatching(query as CFDictionary, &result)
        
        if let data = result as? Data, let token = String(data: data, encoding: .utf8) {
            return token
        }
        return nil
    }
    
    func delete(token: String?) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: "authToken"
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}
```

---

## Utilities

### Currency Formatter

```swift
// Core/Utilities/CurrencyFormatter.swift
import Foundation

class CurrencyFormatter {
    static func format(_ value: Double, currency: String = "USD") -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        formatter.minimumFractionDigits = 2
        formatter.maximumFractionDigits = 2
        
        return formatter.string(from: NSNumber(value: value)) ?? "$\(value)"
    }
    
    static func formatPercent(_ value: Double) -> String {
        return String(format: "%.2f%%", value)
    }
}
```

---

## App Entry Point

```swift
// App/ShareTrackerApp.swift
import SwiftUI

@main
struct ShareTrackerApp: App {
    @StateObject private var authService = AuthenticationService()
    
    var body: some Scene {
        WindowGroup {
            if authService.isAuthenticated {
                TabView {
                    PortfolioView()
                        .tabItem {
                            Label("Portfolio", systemImage: "chart.pie")
                        }
                    
                    CryptoQuotesView()
                        .tabItem {
                            Label("Crypto", systemImage: "bitcoinsign")
                        }
                    
                    ReportsView()
                        .tabItem {
                            Label("Reports", systemImage: "chart.bar")
                        }
                    
                    ProfileView()
                        .tabItem {
                            Label("Profile", systemImage: "person")
                        }
                }
            } else {
                AuthenticationContainer()
                    .environmentObject(authService)
            }
        }
    }
}
```

---

## Testing Strategy

### Unit Tests Example

```swift
// ShareTrackerTests/Portfolio/PortfolioViewModelTests.swift
import XCTest
@testable import ShareTracker

class PortfolioViewModelTests: XCTestCase {
    var viewModel: PortfolioViewModel!
    var mockService: MockPortfolioService!
    
    override func setUp() {
        super.setUp()
        mockService = MockPortfolioService()
        viewModel = PortfolioViewModel(service: mockService)
    }
    
    func testFetchPortfolioSuccess() {
        let mockSummary = PortfolioSummary(
            totalValue: 10000,
            totalInvested: 5000,
            totalGainLoss: 5000,
            gainLossPercent: 100,
            positions: [],
            lastUpdated: Date()
        )
        
        mockService.mockResult = .success(mockSummary)
        
        viewModel.refresh()
        
        XCTAssertEqual(viewModel.portfolioSummary?.totalValue, 10000)
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.error)
    }
    
    func testFetchPortfolioFailure() {
        mockService.mockResult = .failure(.requestFailed(NSError(domain: "test", code: -1)))
        
        viewModel.refresh()
        
        XCTAssertNil(viewModel.portfolioSummary)
        XCTAssertNotNil(viewModel.error)
        XCTAssertFalse(viewModel.isLoading)
    }
}

class MockPortfolioService: PortfolioService {
    var mockResult: Result<PortfolioSummary, NetworkError>?
    
    override func fetchPortfolioSummary() -> AnyPublisher<PortfolioSummary, NetworkError> {
        if let result = mockResult {
            return Result.Publisher(result).eraseToAnyPublisher()
        }
        return Fail(error: .requestFailed(NSError())).eraseToAnyPublisher()
    }
}
```

---

## Development Setup

### Requirements

- Xcode 15.0+
- iOS 15.0+
- Swift 5.9+

### Installation

1. Clone the repository
2. Open `ShareTracker.xcodeproj` in Xcode
3. Create a `.xcconfig` file with API configuration:

```xcconfig
// Config.xcconfig
API_URL = http://localhost:5000/api
CLERK_PUBLISHABLE_KEY = pk_test_...
```

4. Build and run on simulator or device

### Running Tests

```bash
xcodebuild test -scheme ShareTracker -destination 'platform=iOS Simulator,name=iPhone 15'
```

---

## Key Features Checklist

- [ ] User authentication (Sign in/Sign up)
- [ ] Complete profile setup
- [ ] Portfolio view with summary
- [ ] Add/Edit/Delete trades
- [ ] Position tracking and gain/loss calculation
- [ ] Cryptocurrency quotes with real-time updates
- [ ] Forex currency rates
- [ ] Capital gains reporting
- [ ] Report generation and export (PDF, CSV)
- [ ] Offline support with CoreData
- [ ] Push notifications for price alerts
- [ ] Dark mode support
- [ ] Share functionality for reports
- [ ] Biometric authentication (Face ID/Touch ID)

---

## Next Steps

1. Set up Xcode project with CocoaPods/SPM dependencies
2. Implement Core Data models for offline caching
3. Add WebSocket support for real-time quote updates
4. Implement certificate pinning for security
5. Add comprehensive error handling and logging
6. Set up CI/CD pipeline with GitHub Actions
7. Implement analytics tracking
8. Add push notifications service

