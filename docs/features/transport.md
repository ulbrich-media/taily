# Transport

The transport step covers getting the animal from its current location to the adopter or a staging point close to them. Transport is typically only worthwhile once enough animals are ready, so animals often wait until a transport run is organised.

## How Transport Works

A single transport can cover multiple animals going to different adopters. Animals are assigned to a transport through their adoption record once a transport run is scheduled. The transport is then marked as done when the animals have arrived.

### Transport record

Each transport has:
- **Planned date** (optional) — the calendar day the transport is scheduled to happen
- **Notes** — a free-text field for any relevant information about the run
- **Done** — a flag set when the transport is marked as completed; this is a one-way action and cannot be undone

### Transport status on an adoption

From the adoption's perspective the transport step has three states:

| Status | Meaning |
|--------|---------|
| **Not started** | No transport has been assigned to the adoption yet |
| **Transport planned** | A transport is assigned but not yet done |
| **Done** | The assigned transport has been marked as done |

## Managing Transports

Transports are managed from the **Vermittlungen** section in the main navigation. The section has two tabs: *Vermittlungen* (adoption list) and *Transporte* (transport list).

### Transport list

The transport list shows all transports — both open and completed — with:
- Planned date
- Number of animals
- Status badge (open / completed)

A new transport can be created via the *Transport anlegen* button. Clicking *Öffnen* on any row opens a dialog with the full transport details.

### Transport detail dialog

The dialog shows all information about the transport and allows:
- **Editing** the planned date and notes
- **Marking as done** — opens a confirmation prompt; this cannot be undone
- **Deleting** the transport — adoptions linked to it will have their transport reference cleared
- **Viewing linked adoptions** — lists the animal name and applicant for each adoption, with a link to the adoption detail

## Assigning a Transport to an Adoption

From the adoption detail page, the *Transport* step card shows the currently assigned transport (planned date, done status) or a placeholder when none is assigned.

- **Transport zuweisen / Transport ändern** — opens a dialog to select any open (not yet done) transport
- **Transport entfernen** — removes the transport reference from the adoption after confirmation

## Relation to Handover

Transport and handover are separate steps. A transport delivers the animal to a location (which may be the adopter's home or a temporary staging point). The handover marks the moment the adopter actually receives the animal. In many cases these happen at the same time, but not always — for example when the animal stays briefly at a foster home after arriving.
