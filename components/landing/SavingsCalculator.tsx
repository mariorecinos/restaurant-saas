"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCents } from "@/lib/utils"

const PLATFORM_RATES: Record<string, number> = {
  grubhub: 0.3,
  doordash: 0.3,
  ubereats: 0.3,
  other: 0.25,
}

export default function SavingsCalculator() {
  const [monthlyOrders, setMonthlyOrders] = useState(200)
  const [avgOrderValue, setAvgOrderValue] = useState(35)
  const [platform, setPlatform] = useState("doordash")
  const [passTips, setPassTips] = useState(true)

  const rate = PLATFORM_RATES[platform] || 0.3
  const monthlyRevenueCents = monthlyOrders * avgOrderValue * 100
  const currentFeesCents = Math.round(monthlyRevenueCents * rate)

  const driveFeePerOrder = passTips ? 700 : 975
  const ourFeesCents = monthlyOrders * driveFeePerOrder

  const monthlySavingsCents = currentFeesCents - ourFeesCents
  const yearlySavingsCents = monthlySavingsCents * 12

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-center">
          How Much Could You Save?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="monthlyOrders">Monthly Orders</Label>
          <Input
            id="monthlyOrders"
            type="number"
            min="1"
            value={monthlyOrders}
            onChange={(e) => setMonthlyOrders(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="avgOrderValue">Average Order Value ($)</Label>
          <Input
            id="avgOrderValue"
            type="number"
            min="1"
            step="0.01"
            value={avgOrderValue}
            onChange={(e) => setAvgOrderValue(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="platform">Current Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="doordash">DoorDash</SelectItem>
              <SelectItem value="grubhub">Grubhub</SelectItem>
              <SelectItem value="ubereats">Uber Eats</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="passTips"
            type="checkbox"
            checked={passTips}
            onChange={(e) => setPassTips(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="passTips" className="cursor-pointer">
            Pass 100% of tips to driver (-$2.75/order)
          </Label>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Current {platform === "other" ? "" : platform.charAt(0).toUpperCase() + platform.slice(1) + " "}fees ({Math.round(rate * 100)}%)
            </span>
            <span className="font-semibold text-red-600">
              {formatCents(currentFeesCents)}/mo
            </span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              DoorDash Drive fee ({monthlyOrders} orders × {formatCents(driveFeePerOrder)})
            </span>
            <span>{formatCents(ourFeesCents)}/mo</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between">
              <span className="font-semibold">Monthly Savings</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCents(monthlySavingsCents)}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Yearly Savings</span>
              <span className="text-lg font-bold text-green-600">
                {formatCents(yearlySavingsCents)}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            DoorDash Drive: $9.75 flat fee per delivery{passTips ? ", minus $2.75 tip discount = $7.00/delivery" : ""}. All orders assumed to be delivery.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
