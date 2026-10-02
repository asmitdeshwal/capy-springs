import UIKit
import Capacitor

// The game's root view controller: Capacitor's bridge plus home-indicator deferral.
// With the bottom edge deferred, the first swipe up from the home indicator goes to the
// game (the joystick lives in the lower part of the screen); a second swipe leaves the app.
class GameViewController: CAPBridgeViewController {
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { return .bottom }
}
