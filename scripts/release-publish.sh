#!/usr/bin/env bash
# Publish one checked @brunosouzas/design-system tarball to npm and create its GitHub release.
#
# Why: the publish job of .github/workflows/release.yml must publish exactly the bytes the check job
# tested, and a re-run after a failure must finish the release without publishing twice. So it asks
# npm first:
#   - the version is absent (npm answers E404): publish with provenance;
#   - the same integrity with a provenance attestation is there: skip publishing;
#   - the same integrity without provenance, another integrity, or any other npm answer: exit 1,
#     before anything changes. Then the GitHub release: create it when it is not found, leave it
#     when it exists, exit 1 on any other error.
# Same procedure as stackledger's scripts/release-publish.sh, without an SBOM: the package has no
# runtime dependency, so its bill of materials would be empty.
#
# Run (in the publish job, from the checkout of the tagged commit):
#   scripts/release-publish.sh <tarball> <integrity-file>
# Environment: RELEASE_TAG (the tag, v<version>; GITHUB_REF_NAME when unset), GH_TOKEN and GH_REPO
# for gh, NODE_AUTH_TOKEN only for the very first version (docs/release.md). RELEASE_COMMIT, when set
# (a release from a push to main), is the commit the tag is created on, before npm publishing; when
# unset (a pushed tag), the tag already exists. npm, gh and node must be on PATH.
# Exit 0: published or already published, and the release exists. 1: stopped, reason on stderr.
# 2: usage. The tarball is data only: npm publishes it with --ignore-scripts and nothing in it runs.
set -euo pipefail

PACKAGE=@brunosouzas/design-system

if [ "$#" -ne 2 ]; then
  echo "usage: scripts/release-publish.sh <tarball> <integrity-file>" >&2
  exit 2
fi
tarball=$1
integrity_file=$2
tag=${RELEASE_TAG:-${GITHUB_REF_NAME:?RELEASE_TAG or GITHUB_REF_NAME must hold the release tag}}
version=${tag#v}
expected=$(tr -d '[:space:]' < "$integrity_file")
if [ -z "$expected" ]; then
  echo "release: $integrity_file holds no integrity" >&2
  exit 1
fi

fail() {
  echo "release: $*" >&2
  exit 1
}

# Sets found_commit to the commit the tag names on GitHub, or to nothing when the tag does not exist.
# An annotated tag is followed to its commit. Any other answer from GitHub stops the release. (It sets
# a variable instead of printing, so fail stops the script: no command substitution swallows it.)
found_commit=
read_tag_commit() {
  local answer status=0
  found_commit=
  answer=$(gh api "repos/$GH_REPO/git/ref/tags/$tag" --jq '.object.type + " " + .object.sha' 2>&1) || status=$?
  if [ "$status" -ne 0 ]; then
    printf '%s' "$answer" | grep -q 'HTTP 404' && return 0
    fail "cannot read tag $tag on GitHub: $answer"
  fi
  if [ "${answer% *}" = tag ]; then
    status=0
    answer=$(gh api "repos/$GH_REPO/git/tags/${answer#* }" --jq '.object.sha' 2>&1) || status=$?
    [ "$status" -eq 0 ] || fail "cannot read annotated tag $tag on GitHub: $answer"
  else
    answer=${answer#* }
  fi
  found_commit=$answer
}

# From main (RELEASE_COMMIT set), the tag does not exist when the check job ran, but the owner may push
# it by hand meanwhile. So the tag is reserved first, atomically, on the released commit: GitHub
# creates the ref, or answers that it exists. An existing tag must name the released commit, or
# nothing is published. After this the tag is fixed, and the release is created with --verify-tag.
reserve_tag() {
  local answer status=0
  answer=$(gh api -X POST "repos/$GH_REPO/git/refs" -f "ref=refs/tags/$tag" -f "sha=$RELEASE_COMMIT" 2>&1) || status=$?
  if [ "$status" -eq 0 ]; then
    echo "tag $tag created on $RELEASE_COMMIT"
    return 0
  fi
  printf '%s' "$answer" | grep -q 'HTTP 422' || fail "cannot create tag $tag on GitHub: $answer"
  read_tag_commit
  [ "$found_commit" = "$RELEASE_COMMIT" ] || fail "tag $tag names ${found_commit:-nothing}, not the released commit $RELEASE_COMMIT; nothing was published"
  echo "tag $tag already names $RELEASE_COMMIT"
}
if [ -n "${RELEASE_COMMIT:-}" ]; then
  : "${GH_REPO:?GH_REPO must name the repository}"
  reserve_tag
fi

# 1. npm. stdout holds JSON both on success and on error (npm --json); stderr only the log.
lookup_status=0
lookup=$(npm view "$PACKAGE@$version" dist --json 2>/dev/null) || lookup_status=$?

if [ "$lookup_status" -ne 0 ]; then
  # Absent only when npm says E404; a network or authentication error must not look like "absent".
  code=$(printf '%s' "$lookup" | node -e '
    let text = ""; process.stdin.on("data", c => text += c).on("end", () => {
      try { process.stdout.write(String(JSON.parse(text).error.code)); } catch { process.stdout.write("unknown"); }
    });')
  [ "$code" = "E404" ] || fail "npm view $PACKAGE@$version failed ($code); nothing was published"
  echo "$PACKAGE@$version is not on npm: publishing $tarball"
  npm publish "$tarball" --provenance --access public --ignore-scripts
else
  # Prints "<integrity> <yes|no>", or exits 1 when the answer has no integrity.
  # shellcheck disable=SC2016 # ${...} below is a JavaScript template literal, not shell.
  answer=$(printf '%s' "$lookup" | node -e '
    let text = ""; process.stdin.on("data", c => text += c).on("end", () => {
      let dist; try { dist = JSON.parse(text); } catch { process.exit(1); }
      if (!dist || typeof dist.integrity !== "string" || dist.integrity === "") process.exit(1);
      process.stdout.write(`${dist.integrity} ${dist.attestations?.provenance ? "yes" : "no"}`);
    });') || fail "npm view $PACKAGE@$version gave no integrity; nothing was published"
  published=${answer% *}
  provenance=${answer##* }
  [ "$published" = "$expected" ] || fail "$PACKAGE@$version is on npm with integrity $published, not the checked $expected"
  [ "$provenance" = "yes" ] || fail "$PACKAGE@$version is on npm without provenance; deprecate it and release a new version"
  echo "$PACKAGE@$version is already on npm with these bytes and provenance: not publishing again"
fi

# 2. The GitHub release.
view_status=0
view_error=$(gh release view "$tag" 2>&1 >/dev/null) || view_status=$?
if [ "$view_status" -eq 0 ]; then
  echo "release $tag already exists"
elif printf '%s' "$view_error" | grep -q 'release not found'; then
  gh release create "$tag" --verify-tag --generate-notes
else
  fail "gh release view $tag failed: $view_error"
fi
echo "release $tag is complete"
