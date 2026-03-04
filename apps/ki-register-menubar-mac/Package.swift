// swift-tools-version: 6.0
import PackageDescription

let package = Package(
  name: "KIRegisterMenuBar",
  platforms: [
    .macOS(.v13)
  ],
  products: [
    .executable(name: "KIRegisterMenuBar", targets: ["KIRegisterMenuBar"])
  ],
  targets: [
    .executableTarget(
      name: "KIRegisterMenuBar"
    )
  ]
)
