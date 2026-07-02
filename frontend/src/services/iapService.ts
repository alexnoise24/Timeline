import { Capacitor } from '@capacitor/core'
import { Purchases, LOG_LEVEL, PurchasesPackage } from '@revenuecat/purchases-capacitor'

// In-App Purchase via RevenueCat (iOS only). The web keeps using Stripe —
// none of this runs outside the native app.

const ENTITLEMENT_ID = 'pro'

const isNative = () => Capacitor.isNativePlatform()

class IAPService {
  private configured = false

  /** Configure RevenueCat with the logged-in user's Mongo _id as appUserID,
   *  so backend webhooks can map events to our users. Safe to call repeatedly. */
  async init(userId: string) {
    if (!isNative()) return
    const apiKey = import.meta.env.VITE_REVENUECAT_IOS_KEY
    if (!apiKey) {
      console.warn('IAP: VITE_REVENUECAT_IOS_KEY not set, purchases disabled')
      return
    }
    try {
      if (!this.configured) {
        await Purchases.setLogLevel({ level: LOG_LEVEL.WARN })
        await Purchases.configure({ apiKey, appUserID: userId })
        this.configured = true
      } else {
        await Purchases.logIn({ appUserID: userId })
      }
    } catch (e) {
      console.error('IAP: configure failed', e)
    }
  }

  async logout() {
    if (!isNative() || !this.configured) return
    try {
      await Purchases.logOut()
    } catch {
      // logOut throws if already anonymous — ignore
    }
  }

  get isAvailable() {
    return isNative() && this.configured
  }

  /** Returns the monthly Pro package from the current offering, or null. */
  async getProPackage(): Promise<PurchasesPackage | null> {
    if (!this.isAvailable) return null
    try {
      const { current } = await Purchases.getOfferings()
      if (!current) return null
      return current.monthly || current.availablePackages[0] || null
    } catch (e) {
      console.error('IAP: getOfferings failed', e)
      return null
    }
  }

  /** Launches the native purchase sheet. Returns true if the Pro entitlement
   *  is active afterwards. Throws on real errors; returns false on user cancel. */
  async purchasePro(pkg: PurchasesPackage): Promise<boolean> {
    if (!this.isAvailable) return false
    try {
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
      return !!customerInfo.entitlements.active[ENTITLEMENT_ID]
    } catch (e: any) {
      if (e?.userCancelled || `${e?.code}` === 'PURCHASE_CANCELLED') return false
      throw e
    }
  }

  /** Restore previous purchases (required by App Review). */
  async restorePurchases(): Promise<boolean> {
    if (!this.isAvailable) return false
    const { customerInfo } = await Purchases.restorePurchases()
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID]
  }

  /** Whether this device's App Store account has the Pro entitlement active. */
  async hasActiveEntitlement(): Promise<boolean> {
    if (!this.isAvailable) return false
    try {
      const { customerInfo } = await Purchases.getCustomerInfo()
      return !!customerInfo.entitlements.active[ENTITLEMENT_ID]
    } catch {
      return false
    }
  }
}

export const iapService = new IAPService()
