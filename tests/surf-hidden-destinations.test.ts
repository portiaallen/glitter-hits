import assert from "node:assert/strict";
import test from "node:test";
import {
  HIDDEN_DISCOVERY_SITES,
  excludeHiddenDiscoverySites,
  isHiddenFromDiscovery,
} from "../src/lib/discovery/visibility";

test("all Founder-hidden seed destinations are excluded by Surf's shared query filter", () => {
  const filter = excludeHiddenDiscoverySites();
  const conditions = filter.AND;
  assert.ok(Array.isArray(conditions), "expected an array of hidden-site exclusions");
  const urlFilter = conditions[0];
  const titleFilter = conditions[1];
  assert.ok(urlFilter, "expected hidden URL filter");
  assert.ok(titleFilter, "expected hidden title filter");
  assert.ok(urlFilter.url, "expected URL exclusion condition");
  assert.ok(titleFilter.title, "expected title exclusion condition");
  const excludedUrls = urlFilter.url.notIn;
  const excludedTitles = titleFilter.title.notIn;
  for (const site of HIDDEN_DISCOVERY_SITES) {
    assert.ok(excludedUrls.includes(site.url), site.url);
    assert.ok(excludedTitles.includes(site.title), site.title);
    assert.equal(isHiddenFromDiscovery(site.url, site.title), true);
  }
});

test("ordinary member destinations are not blanket-hidden", () => {
  assert.equal(isHiddenFromDiscovery("https://member.example", "Member Site"), false);
});
