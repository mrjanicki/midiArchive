import SwiftUI
import SpriteKit

struct ContentView: View {
    var scene: SKScene {
        let scene = GameScene(size: CGSize(width: 390, height: 844))
        scene.scaleMode = .resizeFill
        return scene
    }

    var body: some View {
        ZStack(alignment: .topLeading) {
            SpriteView(scene: scene)
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 8) {
                Text("8-BIT RUNNER")
                    .font(.system(size: 20, weight: .bold, design: .monospaced))
                    .foregroundStyle(.white)
                Text("Tap to jump • Swipe left/right to switch lanes")
                    .font(.system(size: 12, weight: .medium, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.9))
            }
            .padding(14)
            .background(.black.opacity(0.45))
            .clipShape(RoundedRectangle(cornerRadius: 6))
            .padding()
        }
    }
}

#Preview {
    ContentView()
}
