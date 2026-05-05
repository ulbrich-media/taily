# Transport

The transport step covers getting the animal from its current location to the adopter or a staging point close to them. Transport is typically only worthwhile once enough animals are ready, so animals often wait until a transport run is organised.

## How Transport Works

A single transport can cover multiple animals going to different adopters. Animals are assigned to a transport once one is scheduled, and the transport is then marked as completed when the animals arrive.

From the adoption's perspective, the transport step is:
- **Not started**: No transport has been assigned to the adoption yet.
- **In progress / Done**: Tracked through the transport record itself once the transport feature is fully built.

## Current Status

Transport management is not yet fully implemented in Taily. The adoption record holds a reference to a transport, but the full transport lifecycle (scheduling, assignment, departure, arrival) will be added in a later phase.

For now, when a transport is not relevant or the animal is handed over directly, this step can simply be skipped.

## Relation to Handover

Transport and handover are separate steps. A transport delivers the animal to a location (which may be the adopter's home or a temporary staging point). The handover marks the moment the adopter actually receives the animal. In many cases these happen at the same time, but not always — for example when the animal stays briefly at a foster home after arriving.
