# Applied AI Labs

The shared project for Applied AI Labs, part of the [Applied AI Club at Penn State](https://appliedaipennstate.com).

Every member adds a card to `members/` by having an AI agent open a pull request. A review bot checks each card and merges it, and the cards show up on the wall at https://labs.appliedaipennstate.com/wall/

## Add your card

Go to https://labs.appliedaipennstate.com and follow the three steps.

## How it works

- `members/`: one card per member, named after their GitHub username.
- `bin/labs`: the `labs new`, `labs check`, and `labs submit` commands.
- `lib/`: the card rules, the review decision, and the wall.
- `.github/workflows/`: the review bot and the site deploy.
- `site/`: the start page and the wall.

Run the tests with `node --test`.
