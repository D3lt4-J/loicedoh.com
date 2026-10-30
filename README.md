# Loïc Edoh — Portfolio

Bilingual static portfolio hosted with GitHub Pages at https://loicedoh.com.

## Current source

The validated cartridge-console design is published directly from the repository root. `index.html` is the canonical page source; styles, interactions and media are in `styles/`, `scripts/` and `assets/`. No build or package installation is required.

The release removes the concept-preview banner and uses versioned stylesheet/script URLs to avoid stale browser caches. Delivered With Care retains its video and only the supplied high-resolution park screenshot in its gallery.

Preserve `CNAME` (`loicedoh.com`) and `.nojekyll`. Historical assets remain available so existing URLs continue to work. Experimental `lab-console` and QA pages are not included in this release.

## Preview and validation

From the repository root:

```sh
python -m http.server 8766 --bind 127.0.0.1
python tools/validate_site.py .
python tools/test_project_labels.py
```

Validation requires Python and Node.js, but no third-party packages. It checks release markup, local HTML/CSS resources, JavaScript syntax, the domain configuration and the Delivered With Care gallery.

## Legacy generator

**Do not regenerate this release with the old generator.** `build.py` now exits without writing files because its old template would overwrite the validated interface. The unmodified generator and its data are archived in `archive/legacy-generator/` for reference only. The root `projects.json` is historical data, not the current source of truth.

Make content changes directly in `index.html` until a future generator migration is explicitly designed and tested.

## External services

The contact form uses Web3Forms; embedded videos may use YouTube. No backend is needed on GitHub Pages. Contact submissions must not be sent as part of automated tests.

## Rollback

The pre-migration main commit is `dea378239295a750379a5a881bda263f5b14031c`. To undo the release after publication, revert the release commit and push the revert through the normal deployment process; do not force-push or reset shared history.
