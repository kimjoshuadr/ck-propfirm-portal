/*
 * Brand assets.
 *
 * Imported with `?url`: Vite emits each file, hashes it and hands back the path
 * in the bundle. This file used to build the same URLs through a helper —
 * `const url = (path) => new URL(path, import.meta.url).href` — which Vite
 * cannot analyse, because it only rewrites that call when the path is written
 * literally at the call site. The dev server happily served the source paths, so
 * nothing looked wrong until the built site went up: every image on it 404ed,
 * and no brand file was emitted at all.
 *
 * Keep these as direct imports. A helper that builds paths at runtime is the
 * thing that broke it.
 */
import logo from '../../assets/brand/logo.svg?url'
import favicon from '../../assets/brand/favicon.png?url'
import promo from '../../assets/brand/promo-70off.jpg?url'
import video from '../../assets/brand/trader-65k.jpg?url'
import discord from '../../assets/brand/discord-community.jpg?url'
import certificate from '../../assets/brand/payout-certificate.jpg?url'
import payoutProof from '../../assets/brand/payout-proof.png?url'
import mascot from '../../assets/brand/mascot-hero.png?url'
/* The vendors' own artwork for the downloads page. */
import tradeLocker from '../../assets/brand/platform-tradelocker.png?url'
import metaTrader5 from '../../assets/brand/platform-metatrader5.jpg?url'

export const brand = {
  logo,
  favicon,
  promo,
  /* Connect row + certificates band */
  video,
  discord,
  certificate,
  payoutProof,
  mascot,
  tradeLocker,
  metaTrader5,
}
