"use client"

import { useQuote } from "../quote-provider"
import { CostsDrawer } from "./costs-drawer"
import { GuestDrawer } from "./guest-drawer"
import { RoomingDrawer } from "./rooming-drawer"

/**
 * Mounts the active drawer based on context state. The Sheet primitive
 * portals its content to the body, so the cockpit layout is unaffected.
 */
export function DrawerRoot() {
  const { drawer } = useQuote()
  if (!drawer) return null

  switch (drawer.type) {
    case "guest":
      return <GuestDrawer guestId={drawer.guestId} />
    case "rooming":
      return <RoomingDrawer roomId={drawer.roomId} />
    case "costs":
      return <CostsDrawer />
    default:
      return null
  }
}
