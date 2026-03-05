import SpriteKit

final class GameScene: SKScene, SKPhysicsContactDelegate {
    private let laneX: [CGFloat] = [-100, 0, 100]
    private var currentLane = 1

    private let player = SKSpriteNode(color: .clear, size: CGSize(width: 40, height: 40))
    private let floor = SKNode()

    private var score = 0
    private let scoreLabel = SKLabelNode(fontNamed: "Menlo-Bold")
    private var gameOver = false

    private let playerCategory: UInt32 = 0x1 << 0
    private let obstacleCategory: UInt32 = 0x1 << 1

    override func didMove(to view: SKView) {
        backgroundColor = SKColor(red: 0.06, green: 0.08, blue: 0.16, alpha: 1)

        physicsWorld.gravity = CGVector(dx: 0, dy: -24)
        physicsWorld.contactDelegate = self

        buildTrack()
        buildPlayer()
        configureHUD()
        startSpawning()
        animateGround()
    }

    private func buildTrack() {
        floor.position = CGPoint(x: 0, y: 140)
        floor.physicsBody = SKPhysicsBody(edgeFrom: CGPoint(x: -size.width, y: 0),
                                          to: CGPoint(x: size.width, y: 0))
        floor.physicsBody?.isDynamic = false
        addChild(floor)

        for y in stride(from: CGFloat(140), through: size.height, by: 48) {
            for lane in laneX {
                let tile = SKSpriteNode(color: SKColor(red: 0.2, green: 0.22, blue: 0.35, alpha: 1),
                                        size: CGSize(width: 52, height: 12))
                tile.position = CGPoint(x: lane, y: y)
                tile.zPosition = -1
                addChild(tile)
            }
        }
    }

    private func buildPlayer() {
        player.position = CGPoint(x: laneX[currentLane], y: 180)

        let texture = pixelTexture(colors: [
            [.clear, .clear, .cyan, .cyan, .cyan, .clear, .clear, .clear],
            [.clear, .cyan, .cyan, .yellow, .cyan, .cyan, .clear, .clear],
            [.clear, .cyan, .yellow, .yellow, .yellow, .cyan, .clear, .clear],
            [.cyan, .yellow, .yellow, .red, .yellow, .yellow, .cyan, .clear],
            [.cyan, .yellow, .yellow, .yellow, .yellow, .yellow, .cyan, .clear],
            [.clear, .cyan, .blue, .yellow, .blue, .cyan, .clear, .clear],
            [.clear, .white, .clear, .clear, .clear, .white, .clear, .clear],
            [.white, .clear, .clear, .clear, .clear, .clear, .white, .clear]
        ])
        player.texture = texture

        player.physicsBody = SKPhysicsBody(rectangleOf: CGSize(width: 30, height: 34))
        player.physicsBody?.allowsRotation = false
        player.physicsBody?.categoryBitMask = playerCategory
        player.physicsBody?.contactTestBitMask = obstacleCategory
        player.physicsBody?.collisionBitMask = 0
        addChild(player)
    }

    private func configureHUD() {
        scoreLabel.fontSize = 24
        scoreLabel.horizontalAlignmentMode = .left
        scoreLabel.position = CGPoint(x: -size.width / 2 + 16, y: size.height / 2 - 44)
        scoreLabel.zPosition = 10
        scoreLabel.text = "SCORE 0000"
        addChild(scoreLabel)
    }

    private func startSpawning() {
        let spawn = SKAction.run { [weak self] in self?.spawnObstacle() }
        let wait = SKAction.wait(forDuration: 0.7)
        run(.repeatForever(.sequence([spawn, wait])), withKey: "spawnLoop")

        let tick = SKAction.run { [weak self] in self?.increaseScore() }
        run(.repeatForever(.sequence([tick, .wait(forDuration: 0.2)])), withKey: "scoreLoop")
    }

    private func animateGround() {
        let moveDown = SKAction.moveBy(x: 0, y: -48, duration: 0.2)
        let wrap = SKAction.run { [weak self] in
            self?.children
                .filter { $0.zPosition == -1 && $0.position.y < 120 }
                .forEach { $0.position.y += 48 * 15 }
        }
        run(.repeatForever(.sequence([moveDown, wrap])), withKey: "groundLoop")
    }

    private func spawnObstacle() {
        guard !gameOver else { return }

        let lane = Int.random(in: 0...2)
        let obstacle = SKSpriteNode(color: SKColor(red: 0.9, green: 0.2, blue: 0.25, alpha: 1),
                                    size: CGSize(width: 36, height: 36))
        obstacle.position = CGPoint(x: laneX[lane], y: size.height + 40)
        obstacle.zPosition = 2
        obstacle.texture = pixelTexture(colors: [
            [.clear, .red, .red, .red, .red, .red, .red, .clear],
            [.red, .orange, .orange, .orange, .orange, .orange, .orange, .red],
            [.red, .orange, .black, .orange, .orange, .black, .orange, .red],
            [.red, .orange, .orange, .orange, .orange, .orange, .orange, .red],
            [.red, .orange, .orange, .orange, .orange, .orange, .orange, .red],
            [.red, .orange, .black, .orange, .orange, .black, .orange, .red],
            [.red, .orange, .orange, .orange, .orange, .orange, .orange, .red],
            [.clear, .red, .red, .red, .red, .red, .red, .clear]
        ])
        obstacle.physicsBody = SKPhysicsBody(rectangleOf: CGSize(width: 28, height: 28))
        obstacle.physicsBody?.isDynamic = false
        obstacle.physicsBody?.categoryBitMask = obstacleCategory
        addChild(obstacle)

        let speed = max(1.6, 3.2 - min(CGFloat(score) / 1500, 1.2))
        let move = SKAction.moveTo(y: -40, duration: TimeInterval(speed))
        obstacle.run(.sequence([move, .removeFromParent()]))
    }

    private func increaseScore() {
        guard !gameOver else { return }
        score += 5
        scoreLabel.text = String(format: "SCORE %04d", score)
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
        guard let touch = touches.first, !gameOver else { return }
        let delta = touch.location(in: self) - touch.previousLocation(in: self)

        if abs(delta.x) > abs(delta.y), abs(delta.x) > 20 {
            if delta.x < 0 {
                currentLane = max(0, currentLane - 1)
            } else {
                currentLane = min(2, currentLane + 1)
            }
            let target = CGPoint(x: laneX[currentLane], y: player.position.y)
            player.run(.move(to: target, duration: 0.12))
        } else if isOnGround() {
            player.physicsBody?.velocity.dy = 680
        }
    }

    func didBegin(_ contact: SKPhysicsContact) {
        guard !gameOver else { return }
        gameOver = true

        removeAction(forKey: "spawnLoop")
        removeAction(forKey: "scoreLoop")

        let flash = SKAction.sequence([
            .fadeAlpha(to: 0.2, duration: 0.08),
            .fadeAlpha(to: 1.0, duration: 0.08)
        ])
        player.run(.repeat(flash, count: 5))

        let gameOverLabel = SKLabelNode(fontNamed: "Menlo-Bold")
        gameOverLabel.fontSize = 32
        gameOverLabel.position = CGPoint(x: 0, y: size.height / 2 - 200)
        gameOverLabel.text = "GAME OVER"
        addChild(gameOverLabel)

        let restartLabel = SKLabelNode(fontNamed: "Menlo")
        restartLabel.fontSize = 16
        restartLabel.position = CGPoint(x: 0, y: gameOverLabel.position.y - 30)
        restartLabel.text = "Tap to restart"
        addChild(restartLabel)

        run(.sequence([
            .wait(forDuration: 0.7),
            .run { [weak self] in self?.enableRestart() }
        ]))
    }

    private func enableRestart() {
        isUserInteractionEnabled = true
        let restart = UITapGestureRecognizer(target: self, action: #selector(restartGame))
        view?.addGestureRecognizer(restart)
    }

    @objc private func restartGame() {
        guard let view else { return }
        view.gestureRecognizers?.forEach { view.removeGestureRecognizer($0) }
        let next = GameScene(size: size)
        next.scaleMode = scaleMode
        view.presentScene(next, transition: .crossFade(withDuration: 0.3))
    }

    private func isOnGround() -> Bool {
        guard let body = player.physicsBody else { return false }
        return abs(body.velocity.dy) < 0.2 && player.position.y <= 181
    }

    private func pixelTexture(colors: [[SKColor]]) -> SKTexture {
        let rows = colors.count
        let cols = colors.first?.count ?? 0
        let scale: CGFloat = 4

        UIGraphicsBeginImageContextWithOptions(CGSize(width: CGFloat(cols) * scale,
                                                      height: CGFloat(rows) * scale), false, 1)
        guard let context = UIGraphicsGetCurrentContext() else {
            return SKTexture()
        }

        for (y, row) in colors.enumerated() {
            for (x, color) in row.enumerated() {
                context.setFillColor(color.cgColor)
                context.fill(CGRect(x: CGFloat(x) * scale,
                                    y: CGFloat(y) * scale,
                                    width: scale,
                                    height: scale))
            }
        }

        let image = UIGraphicsGetImageFromCurrentImageContext() ?? UIImage()
        UIGraphicsEndImageContext()

        let texture = SKTexture(image: image)
        texture.filteringMode = .nearest
        return texture
    }
}

private extension CGPoint {
    static func - (lhs: CGPoint, rhs: CGPoint) -> CGPoint {
        CGPoint(x: lhs.x - rhs.x, y: lhs.y - rhs.y)
    }
}
