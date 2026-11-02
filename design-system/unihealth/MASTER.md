# UniHealth Hospital Workspace — UI/UX Pro Max Healthcare Design System

Applied using the **UI/UX Pro Max skill** for enterprise healthcare administration, clinical triage, and ward capacity management.

## 1. Visual Direction & Aesthetic Philosophy

- **Style**: Accessible, Ethical & Clinical Enterprise SaaS
- **Primary Domain**: Hospital Operations, Bed Allocations, Doctor Duty Schedules, and Patient Arrival Triage
- **Typography**: Google Fonts **Figtree** (Headings 600/700/800) + **Noto Sans** (Body & Tabular Data 400/500/600/700)
- **Palette**: Clinical Teal (`#0891B2`), Mint (`#22D3EE`), Emerald (`#16A34A`), Amber (`#D97706`), Crimson (`#DC2626`)
- **Iconography**: Clean inline SVG Heroicons (no emojis used for user interface controls)
- **Motif**: Crisp clinical borders, soft elevation, tabular figures, and glowing status dots

---

## 2. Color Palette & Tokens

| Token | Light Theme | Dark Theme | Role |
| :--- | :--- | :--- | :--- |
| `--primary` | `#0891b2` (Cyan-600) | `#22d3ee` (Cyan-400) | Primary actions, branding, key indicators |
| `--primary-dark` | `#0e7490` (Cyan-700) | `#0891b2` (Cyan-600) | Button hover, gradient endpoints |
| `--tint` | `#ecfeff` (Cyan-50) | `#0e3b4a` | Background highlights, active nav tabs |
| `--emerald` | `#16a34a` (Green-600) | `#4ade80` | Available beds, on duty, completed visits |
| `--amber` | `#d97706` (Amber-600) | `#fbbf24` | Waiting patients, urgent priority, limited beds |
| `--red` | `#dc2626` (Red-600) | `#f87171` | Emergency priority, full ward, cancellations |
| `--bg` | `#f8fafc` (Slate-50) | `#090d16` (Deep Navy) | App background surface |
| `--surface` | `#ffffff` | `#111827` (Slate-900) | Card and modal surfaces |
| `--border` | `#e2e8f0` (Slate-200) | `#1e293b` (Slate-800) | Dividers and containers |
| `--text` | `#0f172a` (Slate-900) | `#f1f5f9` (Slate-100) | High-contrast body text |
| `--muted` | `#64748b` (Slate-500) | `#94a3b8` (Slate-400) | Subtitles, labels, timestamps |

---

## 3. Core Functional Views

### A. Hospital Overview Dashboard
- **Welcome Banner**: Clinical pulse greeting with quick-navigation shortcuts for Patient Queue, Ward Status, and Care Team.
- **Metric Cards**: Available beds, Doctors on duty, Patients waiting, and Average wait time with colored border indicators.
- **Bed Capacity Panel**: Visual progress meters showing occupied vs total beds per ward.
- **At A Glance**: Live ICU occupancy percentage badge, emergency count, and completed visit totals.
- **Audit Stream**: Real-time activity timeline with actor attribution and timestamps.

### B. Doctor Care Team Directory
- **Doctor Cards**: Initials avatar badge, specialty pill, department tag, room number, shift hours (`clock` icon), medical license ID, and direct contact.
- **Duty Status**: Live toggle button (`Mark on duty` / `Set off duty`) with real-time MySQL synchronization.

### C. Beds & Wards Capacity
- **Ward Cards**: Real-time occupancy percentage calculation, status badges (`Available`, `Limited >=80%`, `Full`), and total capacity bars.
- **Ward Types**: General, Emergency, and Intensive Care Unit (ICU).

### D. Patient Arrival & Triage Queue
- **Now Serving Banner**: Live OPD banner highlighting active consultations.
- **Priority Matrix**: `Routine`, `Urgent`, and `Emergency` with distinct semantic badges.
- **Action Workflow**: `Start consultation` -> `Complete visit` -> `Cancel`.

### E. Analytics & Reporting
- **Arrivals Trend Chart**: Styled SVG columns with teal gradient fill.
- **Activity Table**: Tabular breakdown of arrivals, completions, cancellations, and wait times.
- **Capacity Snapshot**: Historical ward utilization percentages over the last 30 days.
- **CSV Export**: Clean spreadsheet export formatted for clinical administration.

### F. Audit Trail
- **Server-signed Audit Log**: Every database mutation (doctor created/updated, ward capacity changed, token status changed) is recorded with timestamp and admin identity.

---

## 4. Accessibility & Responsiveness (WCAG AAA)

- **Keyboard First**: Visible 3px offset focus rings (`var(--primary)`), `Skip to main content` link, `Escape` key closes dialogs and sidebar, `Alt+R` triggers refresh.
- **Touch Targets**: Minimum 44px clickable target height for all buttons and interactive controls.
- **Mobile Navigation**: Collapsible sidebar with backdrop blur overlay and touch-friendly dismiss.
- **Print Stylesheet**: Dedicated `@media print` rules hiding navigation chrome and optimizing tabular patient records for clinical printouts.
- **Reduced Motion**: Full adherence to `prefers-reduced-motion: reduce`.
