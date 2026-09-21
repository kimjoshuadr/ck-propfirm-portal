/*
 * Brand assets. `new URL(..., import.meta.url)` lets Vite resolve, hash and
 * emit each file for the production build instead of relying on a public dir.
 */
const url = (path) => new URL(path, import.meta.url).href

export const brand = {
  logo: url('../../assets/brand/logo.svg'),
  favicon: url('../../assets/brand/favicon.png'),
  promo: url('../../assets/brand/promo-70off.jpg'),
  /* Connect row + certificates band */
  video: url('../../assets/brand/trader-65k.jpg'),
  discord: url('../../assets/brand/discord-community.jpg'),
  certificate: url('../../assets/brand/payout-certificate.jpg'),
  payoutProof: url('../../assets/brand/payout-proof.png'),
  mascot: url('../../assets/brand/mascot-hero.png'),
  /* The vendors' own artwork for the downloads page: TradeLocker's brackets and
     MetaTrader 5's blue tile. Both are square icons that carry their own
     background, so the page frames them the same way rather than recolouring
     either. */
  tradeLocker: url('../../assets/brand/platform-tradelocker.png'),
  metaTrader5: url('../../assets/brand/platform-metatrader5.jpg'),
}
