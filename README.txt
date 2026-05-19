HeroCore MLBB - CLEAN STABLE REBUILD
====================================

This version was rebuilt cleanly instead of patching the older broken files.

Important fixes:
- All Heroes grid is static-rendered in index.html, so it cannot get stuck on "Loading heroes..."
- Discover content is static-rendered.
- All /heroes/ pages are static-rendered and do not depend on JS to show content.
- Tool pages use a small clean app.js.
- Script order is clean and simple.
- No duplicate broken patch code.
- Local image folders are ready but online MLBB-based image links are used by default.
- Works when opening index.html directly.

Files:
- index.html
- tools.html
- counter.html
- draft.html
- matchup.html
- rank-helper.html
- pick-score.html
- compare.html
- favorites.html
- heroes/*.html (116 hero pages)
- data/heroes.js

Note:
- Skill names/descriptions are placeholders until verified manually.
- Official MLBB images are not bundled locally.


Stable tools icon/color upgrade:
- Added colorful icons/logos to tools.html cards
- Added big tool logo to each standalone tool page header
- Added controlled color accents for each tool
- CSS/HTML only; no hero-grid JS changed

Full feature content upgrade:
- Added advanced guide data file: data/advanced-guides.js
- Added enhanced guide content for 10 focus heroes:
  Ixia, Gusion, Franco, Hayabusa, Lesley, Yu Zhong, Atlas, Lancelot, Valir, Gloo
- Added pro gameplay guide sections to hero pages:
  early game, mid game, late game, combo, positioning
- Added hero speciality system:
  early, mid, late, mobility, CC, burst, sustain
- Added smarter counter ratings with stars
- Added smarter draft helper with synergy warnings
- Added realistic pick score:
  team balance, frontline detection, CC detection, damage role checks, lane overlap logic
- Added Rising Heroes section
- Added Favorites preview on homepage
- Added mobile UX improvements

Note:
- Focus hero data is enhanced, but verify exact in-game names/descriptions before public launch.
- Non-focus heroes use role-based pro templates.


Clean skill system update:
- Removed visible official/approx skill names from hero pages.
- Skill cards now show only Passive / Skill 1 / Skill 2 / Ultimate.
- Added Type badges such as Damage, Poke, CC, Mobility, Sustain, Team Fight.
- Added practical Use descriptions.
- Added data/clean-skills.js for easy editing.
- This avoids wrong official names while keeping guides useful.


Pro matchup tool upgrade:
- Fixed matchup result overlap layout
- Added score card redesign
- Added matchup badge colors
- Added Why this matchup section
- Added How to win section
- Added Skill interaction section
- Added Build advice section
- Added Playstyle switch section
- Added mini visual stat bars
- Added responsive layout for mobile

Related heroes + synergy upgrade:
- Added Related Heroes section to every hero page
  * Similar heroes
  * Strong with this hero
  * Strong against this hero
  * Same lane heroes
- Added new synergy.html page
- Added data/synergy.js
- Added Best Duo / Synergy tool
- Added synergy score cards and role-based synergy groups
- Added Synergy tool card to tools.html


Synergy tool grid fix:
- Removed Best Duo / Synergy card from the top header/banner area
- Inserted it correctly inside the tools grid
- Added a soft highlight to the Synergy card


Synergy accuracy upgrade:
- Rebuilt data/synergy.js with role-aware categories for every hero
- Recommendations now change based on selected hero role and lane
- Added lane-conflict penalty
- Added diversity so same heroes do not repeat too much
- Added category-specific reasons
- Synergy page now explains how recommendations are calculated


Expert Duo Override upgrade:
- Added data/synergy-overrides.js
- Added Expert Duo Picks section at the top of synergy results
- Expert picks override generic role logic
- Added sample curated combos such as Johnson + Odette, Ixia + Lolita/Atlas, Atlas + Odette/Ixia
- You can edit data/synergy-overrides.js to add your own experience-based duos


Publish/trust pages added:
- about.html
- contact.html
- privacy-policy.html
- disclaimer.html
- PUBLISH_CHECKLIST.txt

Important:
- Replace vidathnew@gmail.com with your real email before publishing.
- Replace example.com in sitemap.xml with your real domain.
- Update Privacy Policy if you add ads, analytics, forms, accounts, or backend storage.


Customized publish pages:
- Owner: Vidath Lalindu
- Email: vidathnew@gmail.com
- Country: Sri Lanka
- Domain: not yet
- Contact method: email only
- Ads: no ads yet / possible future AdSense


Publish beta content upgrade:
- Added homepage CTA value cards
- Added guides.html with 5 beginner/ranked guides
- Added tier-list.html with S/A/B tiers and best heroes by lane
- Added meta-updates.html
- Added visible accuracy notes
- Added extra synergy override examples
- Updated sitemap with new pages


Rank helper fix:
- Fixed lane mismatch: Gold/Exp/Mid now match dataset values Gold Lane / EXP Lane / Mid Lane
- Added smarter scoring by rank, lane, problem, difficulty, tier and favorite hero
- Added climb plan and warnings sections
- Added visible calculation note


Matchup image fix:
- Fixed missing images in matchup tool
- Matchup portraits now use online hero images instead of missing local paths
- Added fallback initials if image still fails
- Also improved synergy portrait image fallback


Searchable select upgrade:
- Large hero dropdowns are now searchable.
- Supports Arrow Up/Down, Enter, Escape.
- Original select values still update so existing tools keep working.
- Mobile-friendly search panel.


Searchable select mouse fix:
- Fixed mouse click selection not working.
- Uses mousedown + event delegation.
- Hover no longer re-renders the list.
- Keyboard support preserved.


Mobile compact fix:
- Reduced hero card size on mobile only
- Reduced image height and card spacing
- Compact chips/build icons
- Desktop layout unchanged
- Better 360px / 400px phone view


First impression upgrade:
- Premium homepage hero section
- Better CTA buttons
- Tool shortcut strip
- Glow visual showcase
- Mobile-friendly first view


Guide tool suggestion system:
- Added context-matched tool boxes inside guides.
- Added end-of-guide CTA grid to push users into tools.
- Guides now connect to Counter, Matchup, Synergy, Pick Score, Rank Helper and Tier List.

Matchup labels JS-safe fix:
- Adds visible 🟦 Your Hero and 🔴 Enemy Hero labels using JS after page load
- Works with actual matchup IDs: matchHero/matchEnemy and old hero1Select/hero2Select
- Works even when searchable dropdown wraps the original select
- Adds a reliable Swap button

Matchup swap guard fix:
- Swap button is disabled until both Your Hero and Enemy Hero are selected
- Button text explains what to do first
- Prevents confusing empty swap behavior


Details restored + gallery removed correctly:
- Restored hero pages from the last good version.
- Removed only the Skin / Gallery Slots section.
- Hero details/build/tips/related sections are preserved.
- Gallery removed from 116 hero pages.


Human/player feel upgrade:
- Rewrote guides in more natural MLBB player style.
- Added Player Tip sections to 20+ important hero pages.
- Added data/player-tips.js.
- Made About page more personal.
- Reduced repeated generic wording.
- Added human wording helper for future tool phrase variation.


Player tip label cleanup:
- Changed visible 'Vidath’s Note' labels to 'Player Tip'.
- Renamed data/vidath-notes.js to data/player-tips.js.
- Kept About page personal, but hero pages now feel less cringe.


All heroes unique Player Tips:
- Added Player Tip to every hero page.
- Tips are generated from hero role/lane/build/weakness/counter data.
- Manual stronger tips kept for important heroes.
- Added/updated 116 hero pages.
- Data file: data/player-tips.js

Active tab highlight:
- Added automatic current page highlighting in the navbar.
- Tool subpages highlight Tools.
- Hero pages highlight Heroes/Discover area.
- Legal pages highlight About.

About tab fix:
- Added About tab to navbar on root pages and hero pages.
- Active tab highlight now has a real About tab to target.
- Updated 0 pages.

About tab nav-only fix: Added About inside navbar on 127 pages.

Remote image fallback fix:
- Updated data/hero-images.js to use online Fandom Special:FilePath URLs.
- Added smart JS fallback if a remote image fails.
- Added initials fallback instead of grey broken placeholder.
- Added graceful hiding for broken item/skill icons.

Deep online image fix:
- Switched hero-images.js to Fandom Special:Redirect/file URLs.
- Added multi-step fallback for online hero images.
- Added final initials fallback if external image host blocks hotlinking.
- No local images required.
