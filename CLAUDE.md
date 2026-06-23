# ProLuxShine — Kontext för Claude Code

## Vad vi bygger
Fullständig B2B-plattform för ProLuxShine (bilvårdsprodukter — Virtus & Frescura Sverige).
Tre system i ett Next.js-repo:

1. **Kundportal & Webshop** `/(portal)/` — B2B-kunder loggar in och beställer
2. **Admin/CMS** `/(admin)/` — ProLuxShines team hanterar allt
3. **CRM** `/(crm)/` — Säljverktyg för teamet (Bashar m.fl.)

## VIKTIGT — Läs prototyperna först
Mappen `/prototypes/` innehåller tre fullt fungerande HTML-prototyper.
All logik, Supabase-anrop, design och UX är redan validerat där.
**Migrera funktionalitet från HTML → React. Uppfinn inte nytt.**

```
prototypes/
  webshop.html  → bygger /(portal)/
  admin.html    → bygger /(admin)/
  crm.html      → bygger /(crm)/
  README.md     → detaljerad beskrivning av varje fil
```

## Stack
- Next.js 14 App Router + TypeScript
- Supabase (auth + databas + realtime + edge functions)
- Tailwind CSS
- Lucide React (ikoner)

## Supabase (befintligt projekt — ANVÄND DETTA)
- Project ID: `fopshubqliboxgokbhnr`
- URL: `https://fopshubqliboxgokbhnr.supabase.co`
- Region: eu-north-1
- Credentials: se `.env.local`

## Databasschema
Tabeller som finns i Supabase redan:
`products`, `categories`, `price_lists`, `customers`, `orders`, `order_items`,
`deals`, `activities`, `campaigns`, `automations`, `email_config`, `integration_log`,
`automation_runs`, `customer_activities`, `customer_product_views`

## Mappstruktur
```
src/
  app/
    login/                    # Gemensam inloggning
    (portal)/                 # Kundportal (kräver auth)
      dashboard/              # KPIs + rekommendationer
      catalog/                # Produkter + sökning
      orders/                 # Orderhistorik + tracking
      checkout/               # Kassa
    (admin)/                  # Admin (kräver admin-roll)
      dashboard/              # Graf + KPIs + lager
      orders/                 # Orderhantering
      customers/              # Kunder + CRM-panel
      products/               # Produkter CRUD
      campaigns/              # Rabattkoder
    (crm)/                    # CRM-verktyg
      dashboard/              # Välkommen Bashar
      pipeline/               # Kanban
      customers/              # Kundkort
      orders/                 # Ordrar
  components/
    ui/                       # Återanvändbara: Button, Input, Card, Badge, Modal
    layout/                   # Sidebar, Topnav, MobileNav per system
    portal/                   # ProductCard, Cart, OrderCard, TrackingTimeline
    admin/                    # DataTable, OrderPanel, ProductModal, SalesChart
    crm/                      # PipelineBoard, DealCard, CustomerDetailPanel
  lib/
    supabase/client.ts        # Browser-klient
    supabase/server.ts        # Server-klient (RSC)
    utils.ts                  # fmt(), custPrice(), cn(), formatDate()
  types/index.ts              # Alla TypeScript-typer
  hooks/
    useCart.ts                # Varukorg (Context/Zustand)
    useProducts.ts            # Produkter
    useOrders.ts              # Ordrar
  middleware.ts               # Auth-skydd
```

## Designsystem
**Mörkt tema genomgående för alla tre system.**

Färger (Tailwind custom eller CSS vars):
```css
--bg:    #0F1115   /* Bakgrund */
--bg2:   #161920   /* Ytor */
--bg3:   #1E2128   /* Kort */
--bg4:   #252830   /* Input-bakgrund */
--text:  #F0EDE8   /* Primärtext — ALLTID full opacitet */
--text2: #9BA0AB   /* Sekundärtext */
--text3: #5C6270   /* Muted */
--gold:  #E8B84B   /* Accent — priser, primär-CTA */
--green: #4CAF7D
--red:   #E05252
--blue:  #4A8FD4
```

Typografi:
- `Inter` — all UI-text
- `Playfair Display` — display-rubriker (h1, hero-text)

**Kontrastregler (viktigt!):**
- Primärtext ALDRIG under 85% opacitet
- Sekundärtext ALDRIG under 60% opacitet
- Guld BARA på priser och primär-CTA

## Prislistlogik
```typescript
const DISCOUNT = { A: 0.40, B: 0.30, C: 0.20, Standard: 0 }
const custPrice = (listPrice: number, pl: PriceList): number =>
  Math.round(listPrice * (1 - DISCOUNT[pl]))
```

## Auth-flöde
- Kunder loggar in med e-post + lösenord → `/(portal)/`
- Admin loggar in med admin-konto → `/(admin)/`
- Säljare loggar in → `/(crm)/`
- Demo-lösenord: `prolux2024`

## Produktdata
12 ProLuxShine-produkter. Hämtas alltid från Supabase.
Produktbilder från proluxshine.com CDN — visa fallback-emoji om bild saknas.

Kategorier: Tvätt, Fälg, Vax & Polish, Exteriör, Interiör, Avfettning, Tillbehör

## CRM-specifikt
Säljaren heter Bashar. Dashboard-hälsning: "Välkommen, Bashar"
Pipeline-stages: Prospekt → Kontaktad → Offert → Förhandling → Vunnen → Förlorad
Offertgenerator med Gmail-integration (öppnar mail.google.com/mail/?view=cm&...)

## Realtime
Admin-panelen prenumererar på Supabase Realtime för live-ordernotiser:
- INSERT på orders → visa toast + uppdatera lista
- UPDATE på orders → uppdatera status i realtid

## Edge Functions (finns i Supabase)
- `run-automations` — körs dagligen, hanterar email-automationer
