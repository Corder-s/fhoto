# Booking System & Distance-Based Pricing Engine

## 1. Executive Summary

Previously, marketplace bookings applied flat prices regardless of the customer's shoot location. SnapShoot now features a **transparent, location-aware travel pricing engine** that computes real straight-line geodesic distance between the photographer's registered base studio and the customer's event venue.

---

## 2. Configurable Travel Parameters

Each photographer or platform admin configures travel pricing parameters in `creator_profiles` (managed via `/photographer/business`):

| Database Field | Type | Default | Description |
|---|---|---|---|
| `base_address` | `TEXT` | Studio Address | Registered studio location |
| `base_latitude` | `FLOAT8` | e.g. 28.4744 | Studio hub latitude |
| `base_longitude` | `FLOAT8` | e.g. 77.5040 | Studio hub longitude |
| `service_radius_km` | `INT` | 50 km | Maximum distance the creator accepts shoots |
| `included_travel_km` | `INT` | 10 km | Radius around studio where travel is complimentary |
| `travel_fee_per_km` | `NUMERIC` | ₹20.00 | Rate charged per kilometre beyond included distance |
| `min_travel_fee` | `NUMERIC` | ₹0.00 | Floor travel charge if travel fee is non-zero |
| `max_travel_fee` | `NUMERIC` | NULL | Ceiling cap on travel fees |
| `allow_out_of_area` | `BOOLEAN` | false | Whether shoots exceeding service radius are permitted |

---

## 3. Mathematical Pricing Formula

The calculation executes on both frontend live quotation (`/api/bookings/quote`) and authoritative server creation (`/api/bookings/create`):

$$\text{Travel Distance (km)} = \text{Haversine}(\text{Base Coordinates}, \text{Venue Coordinates})$$

$$\text{Chargeable Distance (km)} = \max(0, \text{Travel Distance} - \text{Included Travel KM})$$

$$\text{Travel Fee} = \begin{cases} 0 & \text{if Chargeable Distance} = 0 \\ \max(\text{Min Travel Fee}, \text{Chargeable Distance} \times \text{Rate Per KM}) & \text{if Chargeable Distance} > 0 \end{cases}$$

$$\text{Subtotal} = \text{Base Package Price} + \text{Travel Fee}$$

$$\text{Tax} = \text{Subtotal} \times \text{Tax Rate (e.g. 18\% GST if applicable)}$$

$$\text{Total Price} = \text{Subtotal} + \text{Tax} - \text{Discounts}$$

---

## 4. Distance Calculation Methodology

Distance is computed using the geodesic **Haversine formula** with spherical Earth radius $R = 6,371\text{ km}$:

```ts
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(6371 * c * 10) / 10;
}
```

If coordinates are omitted, the engine resolves the address string against the `KNOWN_HUBS` metropolitan dictionary (Greater Noida, Delhi NCR, Gurgaon, Noida, Mumbai, Bengaluru, Pune, Hyderabad, Jaipur, Kolkata, Goa, etc.).

---

## 5. Standard Test Scenarios (Prompt Section 7.4 Verification)

Assuming: Package Price = **₹5,000**, Included Distance = **10 km**, Travel Rate = **₹20 / km**, Min Fee = **₹0**:

| Scenario | Venue Location | Actual Distance | Chargeable Distance | Travel Fee | Final Price |
|---|---|---|---|---|---|
| **Base Studio** | Greater Noida Studio Hub | 0.0 km | 0.0 km | ₹0 | **₹5,000** |
| **Booking A** | Alpha 1, Greater Noida (5 km away) | 5.0 km | $\max(0, 5 - 10) = 0\text{ km}$ | ₹0 | **₹5,000** |
| **Booking B** | Sector 62, Noida (25 km away) | 25.0 km | $\max(0, 25 - 10) = 15\text{ km}$ | $15 \times 20 =$ **₹300** | **₹5,300** |
| **Booking C** | Connaught Place, Delhi (50 km away) | 50.0 km | $\max(0, 50 - 10) = 40\text{ km}$ | $40 \times 20 =$ **₹800** | **₹5,800** |
| **Out-of-Area** | Jaipur Event (260 km away) | 260.0 km | Exceeds 50 km radius | N/A | **Rejected (`OUT_OF_SERVICE_AREA`)** |

---

## 6. Server-Side Protection & Price Stability

1. **Client Price Ignored**: Any `price` or `travelFee` passed in the request body to `/api/bookings/create` is strictly discarded.
2. **Authoritative Package Lookup**: The backend queries `creator_services` directly using `service_id` to obtain the verified base price.
3. **Immutable Snapshot**: The complete pricing computation is stored directly on the booking record:
   ```json
   {
     "base_price": 5000,
     "travel_distance_km": 25.0,
     "included_travel_km": 10,
     "chargeable_distance_km": 15.0,
     "travel_rate_per_km": 20,
     "travel_fee": 300,
     "platform_fee": 0,
     "tax": 0,
     "total_amount": 5300,
     "calculated_at": "2026-10-14T08:00:00.000Z"
   }
   ```
4. **Price Stability**: If the photographer subsequently increases their base price or travel rate, the existing booking price remains immutable and legally binding.
