# Third-party component notices

TheBoard project code uses Apache-2.0. Dependencies retain their respective
licenses. Each production build packages the installed, lockfile-selected
production dependency license/notice files into `THIRD_PARTY_NOTICES.txt`,
including React, React Flow, Lucide, fflate and their dependencies.

## ELK

The automatic layout feature uses elkjs 0.12.1, distributed by the Eclipse
Layout Kernel project. The package declares `EPL-2.0 OR GPL-3.0-or-later`;
the upstream Eclipse Public License text is included in
[public/licenses/elkjs-LICENSE.md](public/licenses/elkjs-LICENSE.md) and served
under the application's base path at `licenses/elkjs-LICENSE.md` (for example,
`/theboard/licenses/elkjs-LICENSE.md` on GitHub Pages). The distribution uses the
upstream EPL-2.0 option; the project license does not replace it.

Upstream source and attribution: [kieler/elkjs](https://github.com/kieler/elkjs),
[Eclipse Layout Kernel](https://eclipse.dev/elk/).
The exact package version and integrity are recorded in `package-lock.json`.
