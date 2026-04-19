# Data scheme 

The data model is relatively simple. There are 3 key models: 
- Animal: An adoptable animal of any type 
- Person: A person fulfilling a role in the adoption process
- Adoption: The actual adoption process of finding a new owner for the dog.

## Data models

### Animal

An animal that is or was open for adoption. With all his information that is relevant for his adoption. 

#### Animal Type 

Any animal has to be an animal type (like dog, cat). The animal type allows customizing both the animal and the adoption process to meet the requirements of that kind of animal. 

#### Health Condition

A health condition represents either a kind of sickness an animal may have been tested for or a vaccination an animal may receive. Health conditions are created animal type specific and are available while editing these animals. 

### Person 

A person can fulfil multiple roles, requiring different data and making them relevant in different parts of the adoption.
- Mediator
- Adopter
- Foster
- Inspector

#### Organization 

A person may represent an organization (like a club or a non-profit), so these can be managed and assigned to a person as well.

#### Pre-Inspection

At any given time (but ordinarily during an adoption) a pre-inspection can be triggered for a person. It's meant to make sure that the adopter is suitable as an owner for a specific animal type. 

Learn more in [features/pre-inspection.md](./features/pre-inspection.md)

### Adoption 

The adoption process itself is started by an application by the possible adopter. When accepted, the adoption has to go through multiple stages until the adoption counts as finished.
1. Application
2. Pre-inspection
3. Contract signing
4. Transport and handover

After successful adoption, a re-inspection may occur some time later (not part of this apps MVP)

### User

A user is anyone with credentials for logging into this application. They administrate this application, manage persons or animals or guide through an adoption. 

In the future, there may be other types of users like adopters, inspectors, fosters. They are currently either not part of this applications frontend or receive token based access. 
