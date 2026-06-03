import { PaymentService } from "@/payments/service"
import { AnalyticsService } from "@/analytics/service"
import { z } from "zod"
import { helper } from "./helper"

export class BillingService {
  processPayment() {
    return "payment processed"
  }
}

export type BillingStatus = "pending" | "paid"
