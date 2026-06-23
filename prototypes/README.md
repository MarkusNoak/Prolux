# Prototyper — Referens för Claude Code

Dessa tre HTML-filer är fullt fungerande prototyper med all logik validerad.
Använd dem som referens när du bygger React-komponenterna.

## proluxshine-webshop → (portal)/
Kundportal för B2B-kunder. Innehåller:
- Login med prislista-val
- Dashboard med KPIs, senaste ordrar, personliga rekommendationer
- Produktkatalog med smart lokal sökning (synonymer, inga API-anrop)
- Produktmodal med relaterade produkter och bundle-förslag
- Varukorg med cross-sell förslag
- Checkout med kampanjkodsstöd och leveransuppgifter
- Orderhistorik med "Beställ igen"-funktion
- Ordertracking med tidslinje
- Orderbekräftelse med integrationsstatik

Lösenord: prolux2024

## admin.html → (admin)/
Admin-panel för ProLuxShines team. Innehåller:
- Dashboard med säljgraf (Canvas), KPIs, lågt lager
- Orderhantering med sidopanel (redigera status, leveransinfo, anteckningar)
- Kundhantering med CRM-panel (kontaktinfo, ordrar, aktivitetslogg)
- Produkter CRUD (skapa, redigera, ta bort)
- Kampanjer & rabattkoder
- Automationer (toggle aktiv/pausad)
- Integrationer (Visma, transport, e-post status)

Lösenord: admin2024

## crm.html → (crm)/
Säljverktyg för ProLuxShines team. Innehåller:
- Dashboard: "Välkommen, Bashar" + Ny order CTA + snabbkort
  + Frågor från kunder + Skickade offerter + Senaste kunder
- Pipeline: Kanban-board (Prospekt → Vunnen)
- Kunder: Lista + Kundkort med tabs (Översikt/Order/Anteckningar/Pipeline)
- Orderskapande: Produktkatalog med stora bilder, senast beställda överst
  + Ordersammanfattning i sidebar med realtidssummering
- Offertgenerator: Scope-väljare + prissammandrag + Gmail-integration
- Prislistor: A/B/C/Standard med produktpriser per lista

## Supabase
Projekt: fopshubqliboxgokbhnr (eu-north-1, ACTIVE)
URL: https://fopshubqliboxgokbhnr.supabase.co
Alla tre system läser/skriver till samma databas.

## Viktigt om produkter
Statisk produktdata är inbakad i webshop.html (STATIC_PRODS) som fallback.
Supabase-data är primärt — statisk data används bara om Supabase-anrop misslyckas.
I React-versionen: alltid hämta från Supabase, visa skeleton-loader under laddning.
