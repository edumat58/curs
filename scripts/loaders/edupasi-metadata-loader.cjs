const path = require('node:path');

// Loader local, folosit numai de contextul Webpack al hubului EduPASI.
// Returnează exclusiv metadatele necesare cardurilor, nu conținutul complet al
// lecției, și evită recompilarea MDX prin loaderul pluginului docs.
module.exports = function edupasiMetadataLoader(source) {
  const done = this.async();
  this.cacheable?.();

  import('../lib/markdown-metadata.mjs')
    .then(({parseFrontmatter, resolveLessonTitle}) => {
      const frontMatter = parseFrontmatter(source);
      const filenameFallback = path.basename(
        this.resourcePath,
        path.extname(this.resourcePath),
      );
      const title = resolveLessonTitle(source, frontMatter, filenameFallback);

      done(
        null,
        `module.exports = ${JSON.stringify({frontMatter, title})};`,
      );
    })
    .catch(done);
};
