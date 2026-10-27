
# CRM Frontend Design Specification

## Editorial & Refined — Dark Interface System

**Platform:** Web application
**Frontend:** React + Tailwind CSS
**Product:** General-purpose CRM
**Design direction:** Editorial, refined, functional, quietly premium
**Default density:** Balanced
**Primary accent:** Muted Amber `#C49A62`
**Theme:** Dark mode by default
**Status:** Canonical design specification

---

# 1. Product Design Philosophy

## 1.1 Design objective

Create a professional CRM that feels like a carefully designed business tool rather than a generic SaaS dashboard.

The interface must help users manage relationships, process information, and make decisions efficiently. Its visual personality should come from typography, proportions, hierarchy, alignment, material contrast, and purposeful interaction—not gradients, decorative illustrations, oversized cards, or excessive rounding.

The design should combine:

- The editorial clarity of a well-designed publication.
- The precision of a professional data-management application.
- The warmth of a restrained, neutral color palette.
- The usability of a mature enterprise product.
- The consistency of a system designed as one whole.

The CRM should feel distinctive without becoming visually loud.

## 1.2 Core principles

### Principle A — Structure before decoration

Every visual element must serve a purpose. Dividers organize information. Background variations establish hierarchy. Icons communicate recognizable actions. Color signals meaning.

Never add visual elements simply to make an empty area look attractive.

### Principle B — Typography creates hierarchy

Use differences in font size, weight, line height, and contrast to distinguish page titles, section labels, metadata, values, and supporting text.

Do not rely on a separate card, colored background, or oversized heading for every content group.

### Principle C — Surfaces are functional

Use a small number of surface colors to establish the relationship between the application shell, workspace, overlays, and interactive elements.

Avoid placing every element inside its own rounded rectangle.

### Principle D — Density without clutter

Show enough information to make the CRM useful while maintaining readable spacing.

Tables should be efficient. Forms should be clearly grouped. Dashboards should emphasize meaningful metrics rather than filling the viewport with widgets.

### Principle E — Restraint is part of the identity

Muted amber is a deliberate accent, not a background color for the entire application. Use it sparingly for primary actions, selected states, important indicators, and meaningful emphasis.

### Principle F — Consistency is mandatory

A new page must reuse the existing design system. It must not introduce a new color palette, font, radius scale, button style, or navigation pattern without a justified system-wide decision.

---

# 2. Visual Identity

## 2.1 Brand character

The CRM should communicate these attributes:

- Professional, not corporate-generic.
- Warm, not colorful.
- Precise, not sterile.
- Modern, not futuristic.
- Information-rich, not crowded.
- Premium, not ornamental.
- Calm, not visually monotonous.

## 2.2 Visual direction

Use warm near-black surfaces, subtle neutral borders, ivory text, muted secondary text, and amber accents.

The interface should have a consistent visual rhythm: a stable sidebar, a clear page heading, a small number of well-defined actions, and a workspace that prioritizes content.

Avoid imitating a particular product too closely. The identity should emerge from the combined design decisions in this specification.

## 2.3 Prohibited visual direction

The following are explicit design anti-patterns:

- Blue-to-purple, blue-to-green, or multicolor gradients.
- Glassmorphism, frosted glass, and blurred translucent panels.
- Neon glows, luminous borders, and glowing accent buttons.
- Pill-shaped buttons and navigation controls.
- Excessive rounded cards nested inside other rounded cards.
- Giant dashboard numbers without meaningful context.
- Identical stat cards repeated across every page.
- Decorative blobs, abstract circles, and random geometric shapes.
- Large gradient hero sections inside a productivity application.
- Excessive shadows around ordinary content.
- Emoji used as application icons.
- Randomly mixed icon libraries.
- Every section receiving a different background color.
- Fake charts, fabricated metrics, and decorative graphs without meaning.
- Unnecessary animations, bouncing controls, and scroll-triggered theatrics.
- Repeated AI-generated layouts that merely change labels and colors.

**Acceptance rule:** If removing a visual effect improves clarity without losing information, remove the effect.

---

# 3. Design Tokens

All shared visual values must be centralized in CSS variables and mapped into Tailwind utilities where appropriate.

Do not scatter arbitrary hex values, spacing values, or border radii throughout components.

## 3.1 Color system

### Backgrounds and surfaces

| Token                 | Value       | Purpose                            |
| --------------------- | ----------- | ---------------------------------- |
| `bg-canvas`         | `#171614` | Main application workspace         |
| `bg-sidebar`        | `#121210` | Persistent navigation sidebar      |
| `bg-surface`        | `#201F1C` | Raised panels and menus            |
| `bg-surface-hover`  | `#292722` | Hovered interactive surfaces       |
| `bg-surface-active` | `#302D27` | Selected or active surface         |
| `bg-input`          | `#191815` | Input fields and editable controls |
| `bg-overlay`        | `#0C0B0A` | Dialog backdrop, with opacity      |
| `bg-tooltip`        | `#292722` | Tooltip surface                    |

### Typography

| Token              | Value       | Purpose                            |
| ------------------ | ----------- | ---------------------------------- |
| `text-primary`   | `#EAE5DC` | Headings and primary content       |
| `text-secondary` | `#B0AAA0` | Supporting text and descriptions   |
| `text-muted`     | `#827C73` | Metadata, timestamps, placeholders |
| `text-disabled`  | `#625D56` | Disabled content                   |
| `text-on-accent` | `#21180F` | Text on amber-filled controls      |

### Borders and dividers

| Token              | Value       | Purpose                    |
| ------------------ | ----------- | -------------------------- |
| `border-default` | `#39362F` | Standard component borders |
| `border-subtle`  | `#2D2B26` | Section separators         |
| `border-strong`  | `#514B40` | Emphasized boundaries      |
| `border-focus`   | `#C49A62` | Keyboard focus indicator   |

### Accent

| Token              | Value       | Purpose                                 |
| ------------------ | ----------- | --------------------------------------- |
| `accent-primary` | `#C49A62` | Primary accent                          |
| `accent-hover`   | `#D1AA79` | Hovered accent                          |
| `accent-muted`   | `#3A3023` | Selected navigation and subtle emphasis |
| `accent-border`  | `#776044` | Accent borders where necessary          |

Amber should occupy a small proportion of the interface. Most pixels should remain neutral.

### Semantic colors

Semantic colors communicate status and should not become competing brand accents.

| Meaning       | Foreground  | Background  |
| ------------- | ----------- | ----------- |
| Success       | `#91B69A` | `#253329` |
| Warning       | `#D4B16F` | `#393020` |
| Error         | `#D58D83` | `#3A2725` |
| Informational | `#A5B3C0` | `#292F34` |
| Neutral       | `#B0AAA0` | `#302E29` |

Use these colors only when their meaning is clear. Pair status color with text or an icon so users never have to interpret color alone.

## 3.2 Typography

### Font family

Use **Inter** as the default interface font. Use a compatible system sans-serif fallback.

A restrained editorial serif may be introduced for an occasional product-level editorial element only if a future brand decision explicitly justifies it. The default CRM interface should remain sans-serif.

Do not introduce multiple typefaces for individual pages.

### Type scale

| Role             |      Size |   Weight | Line height |
| ---------------- | --------: | -------: | ----------: |
| Page title       | 26–30 px | 550–600 |         1.2 |
| Section title    | 17–19 px | 550–600 |        1.35 |
| Subsection title | 14–16 px | 550–600 |         1.4 |
| Body             |     14 px |      400 |         1.5 |
| Table content    | 13–14 px | 400–450 |        1.45 |
| Supporting text  | 12–13 px |      400 |        1.45 |
| Metadata         | 11–12 px | 400–500 |         1.4 |
| Eyebrow label    |     11 px |      600 |         1.3 |

Use sentence case for page titles, buttons, navigation labels, and section headings.

Use uppercase sparingly for compact table group labels or short metadata labels. Do not turn every heading into uppercase.

### Numeric typography

Use tabular numerals for monetary values, dates, counts, percentages, and other values that need consistent alignment.

Use right alignment for numeric table columns where appropriate.

Avoid making every number bold. Emphasize only values that support a meaningful comparison or decision.

## 3.3 Spacing scale

Use a consistent 4 px base grid.

| Token        | Value | Typical usage                |
| ------------ | ----: | ---------------------------- |
| `space-1`  |  4 px | Icon-to-label micro spacing  |
| `space-2`  |  8 px | Compact internal spacing     |
| `space-3`  | 12 px | Form controls and row groups |
| `space-4`  | 16 px | Standard component padding   |
| `space-5`  | 20 px | Group separation             |
| `space-6`  | 24 px | Section spacing              |
| `space-8`  | 32 px | Major content separation     |
| `space-10` | 40 px | Large layout gaps            |
| `space-12` | 48 px | Exceptional large spacing    |

Default content padding should be 24–32 px on desktop and 16–20 px on smaller screens.

Do not use different spacing values for similar components without a specific reason.

## 3.4 Corner radius

Use restrained, functional rounding.

| Element                 |                  Radius |
| ----------------------- | ----------------------: |
| Text inputs and selects |                 4–6 px |
| Standard buttons        |                 5–6 px |
| Small menus             |                    6 px |
| Dialogs                 |                    8 px |
| Larger workspace panels |                 6–8 px |
| Avatars                 |                     50% |
| Status indicators       | Small rounded rectangle |

Avoid full-pill buttons. Do not use large 16–24 px radii for every card and container.

A square or nearly square shape is acceptable when it improves the sense of precision.

## 3.5 Shadows and elevation

The interface should rely on surface contrast and borders rather than shadows.

- Default content: no shadow.
- Dropdown menus: subtle shadow.
- Modal dialogs: moderate, diffuse shadow.
- Dragged Kanban cards: temporary elevation.
- Hovered buttons: surface or border change rather than glow.

Never apply the same large shadow to every component.

## 3.6 Iconography

Use one consistent icon library: Lucide React.

Guidelines:

- Standard size: 16 px.
- Navigation icons: 17–18 px.
- Compact actions: 14–16 px.
- Prominent empty-state illustrations: use sparingly.
- Standard stroke width: approximately 1.75–2 px.

Use icons to reinforce recognizable actions. Include text labels for primary actions and accessible names for icon-only buttons.

Do not use emoji, decorative Unicode symbols, or inconsistent mixtures of outlined and filled icons.

---

# 4. Application Shell

## 4.1 Desktop layout

The application uses a persistent left sidebar and a flexible main workspace.

Recommended dimensions:

- Sidebar width: 232 px expanded.
- Collapsed sidebar width: 64 px.
- Top utility bar: approximately 56 px high.
- Main content maximum width: flexible, with sensible limits for reading-heavy pages.
- Page content padding: 28 px by default.
- Major section gap: 24–32 px.

The workspace must use available screen space efficiently without stretching every form or detail panel across an ultrawide display.

## 4.2 Sidebar

The sidebar is the primary navigation surface. It should remain visually quiet.

### Structure

1. Brand mark and product name.
2. Workspace or organization selector, if applicable.
3. Primary navigation.
4. Optional pinned or recently visited section.
5. Settings and help near the bottom.
6. User profile and account menu.

### Navigation items

- Overview
- Leads
- Contacts
- Companies
- Deals
- Tasks & Activities
- Reports

Settings, integrations, and user management should be accessible from a clearly separated lower section.

The product may eventually support different CRM configurations, but the sidebar structure should remain consistent.

### Interaction states

**Default:** Muted icon and text.

**Hover:** Slightly lighter neutral background and brighter text.

**Active:** Warm dark-amber background, ivory text, and a subtle amber indicator or border.

**Disabled:** Reduced contrast and no misleading hover behavior.

The active state must be recognizable without depending only on color.

Avoid oversized navigation labels, gradient selection states, and pill-shaped navigation backgrounds.

## 4.3 Top utility bar

The top bar provides secondary navigation and global tools.

Recommended elements:

- Breadcrumbs or current workspace context.
- Global search or command entry.
- Notifications, if implemented.
- Help or keyboard shortcut access.
- User avatar and account menu.

Do not add a row of redundant icon buttons simply because there is space.

Keep global search consistently available throughout the application.

## 4.4 Main page header

Every standard CRM page should follow the same header hierarchy:

1. Optional breadcrumb.
2. Page title.
3. Short description or contextual metadata, when useful.
4. Primary action.
5. Secondary actions, filters, or view controls.

Use a flexible header layout. On smaller screens, actions may move into an overflow menu.

Avoid oversized hero sections and unnecessary decorative banners above data-heavy pages.

---

# 5. Component Design Standards

## 5.1 Buttons

### Primary button

- Background: `#C49A62`.
- Text: `#21180F`.
- Height: 36 px by default.
- Horizontal padding: 12–14 px.
- Radius: 5–6 px.
- Font size: 13–14 px.
- Weight: 550–600.

Use for the primary page action, such as Create lead, Add contact, or Save changes.

### Secondary button

- Transparent or subtle surface background.
- Neutral border.
- Primary text color.
- Same height and radius as primary buttons.

Use for secondary actions such as Cancel, Export, or View details.

### Ghost button

No prominent border or filled background in its resting state.

Use for low-priority actions and compact toolbar controls.

### Destructive button

Use the semantic error palette and an explicit label. Confirm destructive operations when recovery is difficult.

### Rules

- One dominant primary action per main page region.
- Buttons must not default to pill shapes.
- Do not use gradients, glowing shadows, or exaggerated hover transforms.
- Loading buttons must communicate progress and prevent accidental duplicate submission.
- Disabled buttons must have a clear, accessible disabled state.

## 5.2 Inputs and forms

Inputs should look precise and functional.

- Height: 36–40 px.
- Background: `#191815`.
- Border: `#39362F`.
- Radius: 4–6 px.
- Horizontal padding: 10–12 px.
- Label spacing: approximately 6 px.
- Group spacing: approximately 16–20 px.

Forms should include:

- Persistent labels.
- Helpful descriptions only where necessary.
- Clear required-field indicators.
- Inline validation messages.
- Visible keyboard focus.
- Consistent error styling.
- Appropriate autocomplete and input types.

Do not rely on placeholders as the only field labels.

Group related fields logically. Use two columns for compatible fields on wide screens and one column on narrow screens.

For long forms, divide content into meaningful sections rather than placing each field inside a separate card.

## 5.3 Tables

Tables are a core CRM component and must receive careful attention.

### Appearance

- Flat workspace background.
- Subtle horizontal row dividers.
- No excessive cell borders.
- Compact but readable typography.
- Clear column headers.
- Consistent row height, generally 48–56 px.
- Subtle hover background.
- Distinct selected-row state.
- Consistent alignment for values and actions.

### Behavior

- Sortable columns where relevant.
- Search and filtering.
- Pagination or a clearly justified alternative.
- Row selection and bulk actions.
- Column visibility controls when needed.
- Useful empty, loading, and error states.
- Persistent filter state where appropriate.

### Table rules

Do not place a complete rounded card around every row.

Avoid using badges for every text value. Reserve status badges for genuine categorical information.

Keep action menus at the row's end and avoid displaying a large collection of icons in every row.

Long names should truncate gracefully while preserving access to the full value.

## 5.4 Status badges

Use compact rectangular labels with restrained rounding.

Examples:

- New
- Qualified
- In progress
- Won
- Lost
- Overdue

Use semantic colors consistently. A status must always retain its text label.

Do not assign different colors to the same status across different pages.

## 5.5 Avatars and initials

Use small circular avatars for users and contact identities.

When no image exists, show initials on a restrained neutral background. Do not generate arbitrary gradients for each avatar.

Use a consistent size scale, such as 28, 32, and 40 px.

## 5.6 Dropdowns and contextual menus

Menus should have:

- Surface background.
- Subtle border.
- Compact, readable rows.
- Clear hover state.
- Appropriate keyboard navigation.
- Separators only between genuinely distinct groups.

Destructive actions belong in a visually distinct section when appropriate.

## 5.7 Dialogs and drawers

Use dialogs for focused tasks and drawers for contextual workflows where retaining the underlying page is helpful.

Dialogs should have:

- Clear title and optional description.
- Logical form or content structure.
- Explicit close behavior.
- Footer actions with consistent alignment.
- Keyboard focus management.
- Appropriate escape-key behavior.

Do not use oversized dialogs for simple confirmations.

Use a drawer for complex record creation or editing when it makes the workflow easier without hiding important context.

## 5.8 Tooltips

Tooltips are appropriate for icon-only actions and abbreviated labels.

They must not substitute for important information that should always be visible.

Use a small neutral surface and short, descriptive text.

---

# 6. CRM Screen Specifications

Every screen must reuse the shell and components described above.

## 6.1 Overview dashboard

### Objective

Provide a useful summary of business activity and identify what requires attention.

### Layout

**Page header**

- Title: Overview.
- Optional date-range selector.
- A small number of useful page actions.

**Primary summary**

Show three or four meaningful metrics, such as:

- Active leads.
- Open deal value.
- Deals won during the selected period.
- Follow-ups due.

Use compact metric blocks with clear labels, values, and optional comparison text.

Avoid turning every metric into a large, brightly colored card.

**Main workspace**

Use a restrained two-column layout when sufficient data exists:

- Main area: sales activity, pipeline summary, or recent opportunities.
- Secondary area: tasks due, overdue follow-ups, or recent activity.

**Lower section**

Show recent leads or deals in a compact table if the data is useful.

### Dashboard rules

- Every metric must be tied to a defined data source.
- Comparisons must identify the relevant time period.
- Empty datasets must not produce fabricated numbers.
- Charts should answer a real business question.
- Use neutral chart styling with amber for the principal series.
- Provide labels, legends, and accessible alternatives where appropriate.

Do not make the dashboard a collage of unrelated widgets.

## 6.2 Leads page

### Objective

Help users qualify, assign, prioritize, and follow up with prospective customers.

### Layout

Header:

- Leads title.
- Lead count or relevant context.
- Primary action: Add lead.
- Secondary actions: Import and Export, if supported.

Toolbar:

- Search.
- Status filter.
- Source filter.
- Assigned user filter.
- Date filter where relevant.
- Saved views only if supported by the product.

Main content:

A data table containing appropriate fields such as:

- Lead name.
- Company.
- Email or phone.
- Source.
- Status.
- Owner.
- Last activity.
- Next follow-up.

Avoid displaying every possible field at once. Allow column customization when needed.

### Lead creation and editing

Include:

- Name.
- Company or organization.
- Contact details.
- Lead source.
- Status.
- Assigned owner.
- Notes.
- Relevant custom fields.

Provide validation and duplicate detection.

### Lead details

Use a consistent detail-page structure with:

- Lead identity and status.
- Contact information.
- Owner and source.
- Related tasks and activities.
- Notes and history.
- Contextual actions.

Lead conversion should clearly explain what records will be created or linked.

## 6.3 Contacts page

### Objective

Maintain a reliable, searchable directory of individual people.

Display:

- Contact name.
- Associated company.
- Email.
- Phone.
- Owner, if applicable.
- Last interaction.
- Relevant tags or relationship status.

A contact detail page should include:

- Identity and communication details.
- Associated company.
- Related deals.
- Tasks and scheduled follow-ups.
- Interaction timeline.
- Notes and custom fields.

Avoid repeating the same contact information in multiple redundant panels.

## 6.4 Companies page

### Objective

Organize organizations and provide a useful overview of their relationship with the business.

Display fields such as:

- Company name.
- Industry.
- Website.
- Primary contact.
- Number of associated contacts.
- Active deals.
- Account owner.

The company detail page should consolidate its contacts, deals, activities, notes, and relevant metadata.

Do not create complex account hierarchies unless the actual product requirements call for them.

## 6.5 Deals and sales pipeline

### Objective

Help users understand opportunity progress and move deals through a defined sales process.

### Default view: Kanban

Use a horizontal board with clearly separated stages.

Each stage includes:

- Stage name.
- Deal count.
- Optional total deal value.
- Deal cards arranged vertically.

Deal cards should show only essential information:

- Deal name.
- Company or contact.
- Deal value.
- Owner or next action, where useful.
- Expected close date, when relevant.

Cards should have restrained borders and small radii, not floating, heavily shadowed containers.

### Interaction

- Drag-and-drop stage changes, with a clear visual target.
- A keyboard-accessible alternative to drag-and-drop.
- Confirmation or additional fields when stage transitions require them.
- Consistent totals and counts.
- Filters for owner, date, stage, and other relevant dimensions.

Provide a table view when users need to compare many opportunities.

A deal detail page should include value, stage, expected close date, owner, associated records, notes, tasks, and activity history.

## 6.6 Tasks and activities

### Objective

Make follow-up work visible and actionable.

Support relevant activity types:

- Calls.
- Meetings.
- Emails.
- Follow-up tasks.
- Notes.

The task list should emphasize:

- Task title.
- Related record.
- Due date.
- Priority.
- Assignee.
- Status.

Provide views such as Today, Upcoming, Overdue, and Completed if they serve real workflows.

Use clear overdue styling without turning the entire page red.

Completing a task should update its state immediately where possible, with reliable error handling and a clear undo or recovery path when appropriate.

## 6.7 Reports

### Objective

Turn CRM records into useful business information.

Potential reports include:

- Lead sources.
- Lead conversion.
- Deal stage distribution.
- Won and lost deals.
- Sales performance by period.
- Follow-up completion.

Every chart needs a clear title, defined metric, appropriate time period, and honest representation of the underlying data.

Use consistent axes, labels, number formatting, and chart colors.

Never invent data to make a chart appear complete. Use a meaningful empty state when the dataset is insufficient.

## 6.8 Settings

### Objective

Allow authorized users to configure the CRM without cluttering everyday workflows.

Group settings into clear categories:

- Profile and preferences.
- Users and roles.
- Organization settings.
- Pipeline configuration.
- Custom fields.
- Integrations.
- Notifications.

Do not expose administrative controls to users who lack permission.

Use the same form, button, table, and dialog components used elsewhere in the product.

---

# 7. Shared Record Detail Pattern

Leads, contacts, companies, and deals should follow a common information architecture.

## Header region

- Breadcrumb.
- Record name.
- Status, where relevant.
- Owner or key metadata.
- Primary action and contextual overflow menu.

## Main content region

A two-column layout may be used when it improves usability:

- Main column: details, related records, notes, and activity timeline.
- Secondary column: key properties, owner, dates, and related tasks.

The columns should be proportionate to their content. Do not force a sidebar into every detail page if a single-column layout works better.

## Activity timeline

Use a chronological list with:

- Activity type.
- Short description.
- Actor.
- Timestamp.
- Outcome or related details.

Use subtle separators and compact spacing.

Avoid oversized activity cards or decorative timeline connectors that reduce readability.

## Editing

Allow inline editing only for simple, low-risk properties where the behavior is obvious.

Use a consistent form or drawer for more complex changes.

Show clear feedback after saving, and preserve unsaved changes when navigating within a supported workflow.

---

# 8. States and Feedback

Every interactive component and data-driven page must account for more than its ideal state.

## 8.1 Loading

- Use restrained skeletons for structured content when appropriate.
- Match skeleton dimensions to the actual content.
- Use a small progress indicator for short operations.
- Avoid full-page spinners when existing content can remain visible.

## 8.2 Empty states

An empty state should explain:

1. What is missing.
2. Why the area is empty, if known.
3. What the user can do next.

Examples:

- No leads yet — add a lead or import existing records.
- No tasks due today — there is nothing requiring attention right now.
- No results found — adjust the search or remove filters.

Use short copy and a relevant action. Avoid generic illustrations that dominate the page.

## 8.3 Errors

Errors must explain what happened and, where possible, how to recover.

- Inline validation for form errors.
- Clear feedback for failed saves.
- A retry action for recoverable network failures.
- Permission-aware messages for restricted actions.
- Non-blocking notifications for minor operations.

Never show a success message before the operation actually succeeds.

## 8.4 Confirmation and undo

Use confirmation dialogs for irreversible or high-impact actions.

For reversible actions, prefer a clear undo mechanism when practical.

Do not interrupt users with a confirmation for every ordinary interaction.

## 8.5 Notifications

Use compact, consistent notifications.

Success messages should be brief. Errors should be actionable. Warnings should identify the potential consequence.

Do not display several redundant notifications for a single operation.

---

# 9. Interaction and Motion

Motion should clarify cause and effect rather than entertain.

## Timing

- Hover and focus transitions: approximately 100–160 ms.
- Menus and popovers: approximately 120–180 ms.
- Drawers and dialogs: approximately 160–220 ms.

These are starting guidelines, not rigid requirements.

## Permitted motion

- Subtle background transitions.
- Dropdown opening and closing.
- Dialog and drawer transitions.
- Drag-and-drop feedback.
- Loading indicators.
- Small state changes that clarify interaction.

## Prohibited motion

- Continuous decorative animations.
- Bounce effects on standard controls.
- Large scale transformations on hover.
- Animated gradients.
- Parallax in the CRM workspace.
- Animations that delay task completion.

Respect `prefers-reduced-motion`.

---

# 10. Responsive Behavior

The desktop workspace is the primary layout, but the CRM must remain functional on smaller screens.

## Desktop: 1280 px and above

- Persistent expanded sidebar.
- Full page toolbar.
- Data tables with comfortable columns.
- Multi-column detail layouts where appropriate.

## Tablet: 768–1279 px

- Collapsible sidebar.
- Reduced horizontal padding.
- Flexible toolbars.
- Selective hiding of secondary table columns.
- Single-column forms where necessary.

## Mobile: below 768 px

- Sidebar becomes a drawer or compact navigation pattern.
- Primary actions remain accessible.
- Filters move into a dedicated panel when the toolbar no longer fits.
- Forms become single-column.
- Detail layouts become vertically stacked.
- Tables use deliberate horizontal scrolling or an appropriate compact row representation.

Do not simply shrink desktop content until it fits.

Maintain touch targets of approximately 44 × 44 px where practical, particularly for important mobile actions.

---

# 11. Accessibility

Target WCAG 2.2 Level AA.

The design and implementation must include:

- Sufficient text and control contrast.
- Visible keyboard focus.
- Semantic HTML.
- Correct heading hierarchy.
- Accessible form labels and validation messages.
- Keyboard-operable menus, dialogs, tables, and navigation.
- Proper focus management for overlays.
- Accessible names for icon-only buttons.
- Status communication that does not rely on color alone.
- Reduced-motion support.
- Responsive layouts that tolerate text enlargement.
- Keyboard-accessible alternatives to drag-and-drop.

Do not remove focus outlines without replacing them with a clearly visible alternative.

Test the actual rendered colors and interactive states; do not assume that a palette is compliant simply because it looks readable.

---

# 12. React + Tailwind CSS Implementation Standards

## 12.1 Component architecture

Organize the frontend around reusable components and feature-level modules.

Suggested structure:

```text
src/
  app/
    AppLayout.jsx
    routes.jsx

  components/
    layout/
      Sidebar.jsx
      Topbar.jsx
      PageHeader.jsx

    ui/
      Button.jsx
      Input.jsx
      Select.jsx
      Dialog.jsx
      DropdownMenu.jsx
      StatusBadge.jsx
      Avatar.jsx
      DataTable.jsx
      EmptyState.jsx
      LoadingState.jsx
      Toast.jsx

    crm/
      RecordHeader.jsx
      ActivityTimeline.jsx
      RecordProperties.jsx
      TaskList.jsx
      FilterToolbar.jsx
      SearchInput.jsx

  features/
    dashboard/
    leads/
    contacts/
    companies/
    deals/
    tasks/
    reports/
    settings/

  styles/
    globals.css
    tokens.css
```

This is a suggested starting structure, not a mandate to reorganize an existing application unnecessarily.

## 12.2 Centralized tokens

Define the design tokens centrally and reference them through Tailwind utilities or a consistent component styling approach.

Example CSS:

```css
@import "tailwindcss";

@theme {
  --color-canvas: #171614;
  --color-sidebar: #121210;
  --color-surface: #201f1c;
  --color-surface-hover: #292722;
  --color-surface-active: #302d27;

  --color-text-primary: #eae5dc;
  --color-text-secondary: #b0aaa0;
  --color-text-muted: #827c73;

  --color-border-default: #39362f;
  --color-border-subtle: #2d2b26;

  --color-accent: #c49a62;
  --color-accent-hover: #d1aa79;
}
```

This example uses Tailwind CSS v4 syntax. If the project uses Tailwind CSS v3, implement equivalent values in `tailwind.config.js` instead. Do not mix configuration conventions.

## 12.3 Component behavior

- Use shared components for repeated UI patterns.
- Use explicit variants for primary, secondary, ghost, and destructive buttons.
- Keep visual variants consistent across the application.
- Use semantic elements rather than clickable generic containers.
- Avoid duplicating business logic inside visual components.
- Use consistent form handling and validation.
- Implement real loading, error, disabled, and success states.
- Preserve existing project architecture unless the requested work requires a change.

## 12.4 Data integrity

Never fabricate backend data to make the interface appear complete.

Use mock data only when the task explicitly involves a prototype or visual exploration, and label it clearly where necessary.

Do not silently replace an existing API, authentication system, route, or data model while performing a design task.

## 12.5 Dependencies

Prefer the existing stack and installed libraries.

Use Lucide React for icons. Add new dependencies only when they materially improve the implementation and cannot reasonably be handled with the existing stack.

Do not introduce multiple UI component libraries for the same purpose.

---

# 13. Reusable Design-Agent Instructions

The following instructions are the canonical operating rules for any agent tasked with designing, extending, or modifying this CRM.

## Role

You are the product designer and frontend implementation specialist responsible for maintaining a coherent, production-quality CRM interface.

You must treat this specification as the source of truth for the application's visual identity, component behavior, and information architecture.

## Before every design task

1. Inspect the existing application and relevant components.
2. Read the canonical design tokens and shared styling.
3. Identify existing patterns that match the requested feature.
4. Understand the page's actual purpose, data, actions, and user workflow.
5. Reuse existing components where appropriate.
6. Identify missing patterns before introducing new ones.
7. Preserve established conventions unless there is a concrete reason to change them.

Do not redesign unrelated parts of the application just because a new page is being added.

## While designing

- Use the established dark palette and muted amber accent.
- Maintain the editorial, refined visual direction.
- Follow the spacing, typography, radius, and component specifications.
- Prioritize information hierarchy and task completion.
- Keep pages consistent with the shared application shell.
- Use realistic information architecture and appropriate data density.
- Make all interactive controls visually and behaviorally coherent.
- Include loading, empty, error, and success states when relevant.
- Respect accessibility and responsive behavior.
- Prefer composition and spacing over decorative containers.
- Make design decisions based on the page's function, not novelty.

## When a component does not exist

Before creating a new component:

1. Search for an existing equivalent.
2. Determine whether the existing component can be extended through a variant.
3. If the pattern is genuinely new, design it using existing tokens.
4. Make the component reusable if it is likely to recur.
5. Document any new shared pattern in the canonical specification when it changes the system.

Do not create a separate visual style for every feature.

## When asked to design a specific screen

Design only what the screen requires, but ensure that it fits the overall system.

A leads page should feel like it belongs to the same application as the contacts page. A settings dialog should use the same form controls as lead creation. A newly added report should follow the same typography, spacing, and chart conventions as the dashboard.

Do not blindly reuse the same layout for every screen. Consistency means shared rules and coherent behavior, not identical page compositions.

## When asked to modify an existing screen

- Preserve working functionality.
- Maintain established navigation and interaction patterns.
- Avoid unnecessary refactoring.
- Do not remove useful functionality to simplify the design.
- Keep responsive behavior intact.
- Verify that the change does not introduce conflicting styles or component variants.

## Mandatory anti-generic rules

Never introduce the following without an explicit, justified change to the product's visual direction:

- Blue-green gradients.
- Pill-shaped buttons.
- Glassmorphism.
- Excessively rounded cards.
- Unnecessary floating panels.
- Oversized decorative headings.
- Random iconography.
- Arbitrary accent colors.
- Decorative charts with meaningless data.
- Redundant cards surrounding already structured content.
- Excessive animation.
- Inconsistent spacing or typography.
- Novel design patterns that conflict with existing components.

Do not interpret "make it modern" as permission to add gradients, glowing effects, oversized cards, or generic SaaS dashboard patterns.

## If the user asks for a different design direction

Clarify whether the request is:

- A local variation within the existing system.
- A new reusable component pattern.
- An intentional system-wide redesign.

For local variations, preserve the core design tokens. For system-wide changes, update the canonical specification and related components together rather than introducing an isolated visual inconsistency.

Do not ask unnecessary questions when the requirements and existing patterns are sufficient to proceed.

## Completion requirements

Before considering a design task complete, verify:

- The page uses the established design tokens.
- Typography and spacing are consistent.
- Buttons and controls use the correct variants.
- The layout matches the application's navigation and content patterns.
- Interactive elements have meaningful behavior.
- Loading, empty, error, and success states are addressed where applicable.
- The screen works at relevant viewport widths.
- Keyboard navigation and focus visibility are preserved.
- No unrelated functionality has been broken.
- No unapproved visual language has been introduced.

Report any missing backend capability or unimplemented interaction honestly.

---

# 14. Design Review Checklist

The agent must use this checklist before delivering any new or modified screen.

## Visual consistency

- [ ] Uses the established dark palette.
- [ ] Uses muted amber only for purposeful emphasis.
- [ ] Uses consistent typography and spacing.
- [ ] Uses approved corner radii.
- [ ] Avoids gradients, glassmorphism, and pill-shaped buttons.
- [ ] Avoids unnecessary cards, shadows, and decorative elements.
- [ ] Uses the shared icon library.

## Usability

- [ ] Has a clear primary action.
- [ ] Has a logical content hierarchy.
- [ ] Makes important information easy to scan.
- [ ] Provides appropriate search, filtering, or sorting where required.
- [ ] Handles empty, loading, and error states.
- [ ] Provides meaningful feedback for actions.

## Engineering

- [ ] Reuses existing components.
- [ ] Uses centralized tokens.
- [ ] Preserves existing routes and functionality.
- [ ] Uses semantic and accessible controls.
- [ ] Works at desktop, tablet, and mobile sizes.
- [ ] Avoids fabricated data and misleading success states.
- [ ] Introduces no unnecessary dependencies.

## Final review

- [ ] The page feels like part of the same CRM.
- [ ] Every visual element serves a purpose.
- [ ] No design decision contradicts the canonical specification.
- [ ] Any justified deviation is documented.

A design is not complete merely because it looks polished in a screenshot. It must be coherent, usable, accessible, and consistent with the rest of the product.

---

# 15. Final Design Standard

The CRM should be recognizable through its restrained visual language:

**Warm charcoal. Ivory typography. Muted amber. Precise spacing. Fine dividers. Functional controls. Clear information hierarchy.**

Its quality should come from the discipline of the system, not the quantity of visual effects.

Every new screen must extend the product rather than restart its design.

**Canonical rule:** Preserve the system first. Introduce novelty only when it solves a real user problem. If a design decision does not improve clarity, usability, accessibility, or meaningful product identity, do not introduce it.
