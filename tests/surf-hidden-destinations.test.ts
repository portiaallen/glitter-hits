import assert from "node:assert/strict";
import test from "node:test";
import {
  HIDDEN_DISCOVERY_SITES,
  excludeHiddenDiscoverySites,
  isHiddenFromDiscovery,
} from "../src/lib/discovery/visibility";

test("all Founder-hidden seed destinations are excluded by Surf's shared query filter", () => {
  const filter = excludeHiddenDiscoverySites();
  const excludedUrls = filter.AND[0].url.notIn;
  const excludedTitles = filter.AND[1].title.notIn;
  for (const site of HIDDEN_DISCOVERY_SITES) {
    assert.ok(excludedUrls.includes(site.url), site.url);
    assert.ok(excludedTitles.includes(site.title), site.title);
    assert.equal(isHiddenFromDiscovery(site.url, site.title), true);
  }
});

test("ordinary member destinations are not blanket-hidden", () => {
  assert.equal(isHiddenFromDiscovery("https://member.example", "Member Site"), false);
});
