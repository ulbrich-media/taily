# Transport

The transport step covers getting the animal from its current location to the adopter or a staging point close to them. Transport is typically only worthwhile once enough animals are ready, so animals often wait until a transport run is organised.

## How Transport Works

A single transport can cover multiple animals going to different adopters. Animals are assigned to a transport through their adoption record once a transport run is scheduled. The transport is then marked as done when the animals have arrived.

### Transport record

Each transport has:
- **Name** (optional) — a human-readable label for the run (e.g. "Süddeutschland-Tour"); when set it is used as the display title everywhere instead of the date-based fallback
- **Planned date** (optional) — the calendar day the transport is scheduled to happen
- **Responsible person** (optional) — a mediator from the people directory who is in charge of organizing this run
- **Transporter** (optional) — the name of the person or company physically carrying out the transport
- **Notes** — a free-text field for any relevant information about the run
- **Done** — a timestamp set when the transport is marked as completed; this is a one-way action and cannot be undone

### Display title

The transport title shown in cards and dropdowns follows this priority:

1. **Name** — if the name field is non-empty it is used as-is
2. **"Transport am DD.MM.YYYY"** — if a planned date is set
3. **"Transport"** — plain fallback when neither is available

### Transport status on an adoption

From the adoption's perspective the transport step has three states:

| Status                | Meaning                                              |
|-----------------------|------------------------------------------------------|
| **Not started**       | No transport has been assigned to the adoption yet   |
| **Transport planned** | A transport is assigned but not yet done             |
| **Done**              | The assigned transport has been marked as done       |

## Managing Transports

Transports are managed from the **Transporte** section in the main navigation.

### Transport list

The list is split into two sections fetched independently from the API:

- **Geplante Transporte** — open transports (`done_at` is null), sorted by planned date ascending (soonest first); transports without a date appear at the end
- **Abgeschlossene Transporte** — completed transports (`done_at` is set), sorted by completion date descending (most recent first)

Each transport is shown as a detail card with planned date, completion date, responsible person, transporter, notes, and the linked adoptions.

A new transport can be created via the *Transport anlegen* button.

### Creating and editing a transport

Both the create dialog and the edit dialog expose the same fields:

| Field              | Notes                                    |
|--------------------|------------------------------------------|
| Name               | Optional free-text label                 |
| Planned date       | Cannot be in the past                    |
| Responsible person | Selected from the mediator list          |
| Transporter        | Optional free-text name of the carrier   |
| Notes              | Free-text                                |

### Marking a transport as done

Opening *Abschließen* shows a form pre-filled with today's date. The date can be changed to any date in the past to record when the transport actually happened. Confirming sets `done_at` and the transport moves to the completed section. This action cannot be undone.

### Deleting a transport

Deleting a transport clears the transport reference on all linked adoptions (their transport step reverts to "not started").

## Assigning a transport to an Adoption

From the adoption detail page, the *Transport* step card shows the currently assigned transport or a placeholder when none is assigned.

- **Transport zuweisen / Transport ändern** — opens a dialog to select any open (not yet done) transport; the dropdown shows the transport title and the number of animals already on that run
- **Transport entfernen** — removes the transport reference from the adoption after confirmation

## Relation to Handover

Transport and handover are separate steps. A transport delivers the animal to a location (which may be the adopter's home or a temporary staging point). The handover marks the moment the adopter actually receives the animal. In many cases these happen at the same time, but not always — for example when the animal stays briefly at a foster home after arriving.
