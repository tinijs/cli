import {compileString} from 'sass';
import {resolve} from 'pathe';
import {camelCase, pascalCase} from 'change-case';
import CleanCSS from 'clean-css';
import chalk from 'chalk';
import fsExtra from 'fs-extra';

import {success} from '../../lib/helpers/message.js';
import {cleanDir, listDir} from '../../lib/helpers/file.js';
import {loadProjectPackageJson} from '../../lib/helpers/project.js';
import {transpileAndOutputFiles} from '../../lib/helpers/typescript.js';
import {buildStaging} from '../../lib/helpers/build.js';
import {
  COMPONENTS_DIR,
  BLOCKS_DIR,
  STYLES_DIR,
  TS_CONFIG,
  getCSSUtils,
} from '../../lib/helpers/ui.js';

const {blueBright, bold} = chalk;
const {pathExists, ensureDir, copy, copyFile, writeJson, outputFile, readFile} =
  fsExtra;

export const APP_DIR = 'app';
export const UI_PACKAGE_NAME = '@tinijs/ui';

export default async function (packageName: string, soulName?: string) {
  packageName = !packageName
    ? UI_PACKAGE_NAME
    : `${packageName}-${!soulName ? 'common' : soulName}`;
  const destPath = resolve('build', packageName);
  // clean
  await cleanDir(destPath);
  // build
  let buildType = 'common';
  if (packageName === UI_PACKAGE_NAME) {
    buildType = 'bare';
    await buildBare(destPath);
  } else if (soulName) {
    buildType = 'soul';
    await buildSoul(destPath, soulName);
  } else {
    await buildCommon(destPath);
  }
  // package.json
  const {
    description,
    version,
    author = '',
    homepage = '',
    license = '',
    keywords = [],
  } = await loadProjectPackageJson();
  await writeJson(
    resolve(destPath, 'package.json'),
    {
      name: packageName,
      version,
      description,
      author,
      homepage,
      license,
      keywords,
      files: [
        '**/*.d.ts',
        '**/*.js',
        '**/*.js.map',
        '**/*.scss',
        '**/*.css',
        '**/*.css.map',
        ...(buildType !== 'common'
          ? []
          : [
              '**/*.ts',
              '!app/**/*.ts',
              'app/**/*.d.ts',
              '**/*.ico',
              '**/*.svg',
              '**/*.webp',
              '**/*.jpg',
              '**/*.png',
              '**/*.woff',
              '**/*.woff2',
              '**/*.html',
              '**/*.md',
              '**/*.txt',
            ]),
      ],
      ...(buildType !== 'bare'
        ? {}
        : {
            scripts: {
              postinstall: 'cd ../../../ && tini ui use --build-only',
            },
          }),
    },
    {spaces: 2}
  );
  // license
  const licensePath = resolve('LICENSE');
  if (await pathExists(licensePath)) {
    await copyFile(licensePath, resolve(destPath, 'LICENSE'));
  }
  // README.md
  const readmePath = resolve('README.md');
  if (await pathExists(readmePath)) {
    await copyFile(readmePath, resolve(destPath, 'README.md'));
  }
  // result
  success(`Build ${bold(blueBright(packageName))} successfully!`);
}

async function buildBare(destPath: string) {
  // utilities
  await outputFile(resolve(destPath, 'utilities.css'), getCSSUtils());
}

async function buildCommon(destPath: string) {
  // components
  await copy(resolve(COMPONENTS_DIR), resolve(destPath, COMPONENTS_DIR));
  // blocks
  await copy(resolve(BLOCKS_DIR), resolve(destPath, BLOCKS_DIR));
  // app
  const stagingPath = await buildStaging();
  const appOutPath = resolve(destPath, APP_DIR);
  await copy(stagingPath, appOutPath);
  const appTSPaths = (await listDir(appOutPath)).filter(path =>
    path.endsWith('.ts')
  );
  await transpileAndOutputFiles(appTSPaths, TS_CONFIG, appOutPath, path =>
    path.replace(`${appOutPath}/`, '')
  );
}

async function buildSoul(destPath: string, soulName: string) {
  const paths = await listDir(resolve(STYLES_DIR, soulName));
  const stylesPathProcessor = (path: string) =>
    path.split(`/${STYLES_DIR}/${soulName}/`).pop() as string;

  /*
   * 1. ts
   */

  const tsPaths = paths.filter(path => path.endsWith('.ts'));
  await transpileAndOutputFiles(
    tsPaths,
    TS_CONFIG,
    `${destPath}/${STYLES_DIR}`,
    stylesPathProcessor
  );

  /*
   * 2. css/scss
   */

  const scssPaths = paths.filter(
    path => path.endsWith('.css') || path.endsWith('.scss')
  );
  for (let i = 0; i < scssPaths.length; i++) {
    const path = scssPaths[i];
    const filePath = stylesPathProcessor(path);
    const fileName = filePath.split('/').pop() as string;
    // dir
    const dirPaths = filePath.split('/');
    dirPaths.pop();
    await ensureDir(resolve(destPath, STYLES_DIR, ...dirPaths));
    // .css
    if (path.endsWith('.css')) {
      await copyFile(path, resolve(destPath, STYLES_DIR, filePath));
    }
    // .scss
    else {
      // .css & .css.map
      const content = await readFile(path, 'utf8');
      const {css, sourceMap} = compileString(content, {
        sourceMap: true,
        loadPaths: [resolve(STYLES_DIR, soulName, ...dirPaths)],
      });
      await outputFile(
        resolve(destPath, STYLES_DIR, filePath.replace('.scss', '.css')),
        css +
          '\n' +
          `/*# sourceMappingURL=${fileName.replace('.scss', '.css.map')} */`
      );
      const useSourceMap = (sourceMap || {}) as any;
      useSourceMap.sources = [fileName.replace('.scss', '.css')];
      await outputFile(
        resolve(destPath, STYLES_DIR, filePath.replace('.scss', '.css.map')),
        JSON.stringify(useSourceMap)
      );
      // .min.css & .min.css.map
      const {styles: minCss, sourceMap: minSourceMap} = new CleanCSS({
        sourceMap: true,
      }).minify(css);
      await outputFile(
        resolve(destPath, STYLES_DIR, filePath.replace('.scss', '.min.css')),
        minCss +
          '\n' +
          `/*# sourceMappingURL=${fileName.replace('.scss', '.min.css.map')} */`
      );
      await outputFile(
        resolve(
          destPath,
          STYLES_DIR,
          filePath.replace('.scss', '.min.css.map')
        ),
        (minSourceMap?.toString() || '').replace(
          '"$stdin"',
          `"${fileName.replace('.scss', '.css.min')}"`
        )
      );
      // .scss
      await copyFile(path, resolve(destPath, STYLES_DIR, filePath));
    }
  }

  /*
   * 3. components/custom-components, blocks/custom-blocks
   */
  await buildSoulComponents(COMPONENTS_DIR, destPath);
  await buildSoulComponents(BLOCKS_DIR, destPath);
  await buildSoulComponents(`custom-${COMPONENTS_DIR}`, destPath);
  await buildSoulComponents(`custom-${BLOCKS_DIR}`, destPath);

  /*
   * 4. Extract base .ts into .css
   */
  const basePaths = (
    await listDir(resolve(STYLES_DIR, soulName, 'base'))
  ).filter(path => path.endsWith('.ts'));
  for (let i = 0; i < basePaths.length; i++) {
    const path = basePaths[i];
    const pathArr = path.split('/');
    const fileName = pathArr.pop() as string;
    const tsContent = await readFile(path, 'utf8');
    const cssContentMatching = tsContent.match(
      /(export default css`)([\s\S]*?)(`;)/
    );
    if (!cssContentMatching) continue;
    const cssContent = cssContentMatching[2];
    await outputFile(
      resolve(destPath, STYLES_DIR, 'base', fileName.replace('.ts', '.css')),
      cssContent
    );
  }

  /*
   * 5. Utilities
   */
  await outputFile(resolve(destPath, 'utilities.css'), getCSSUtils());
}

async function buildSoulComponents(inputDir: string, destPath: string) {
  // check input dir
  const inputPath = resolve(inputDir);
  if (!(await pathExists(inputPath))) return;

  /*
   * A. Build
   */
  const componentPaths = (await listDir(inputPath)).filter(path =>
    path.endsWith('.ts')
  );
  const componentsPathProcessor = (path: string) =>
    path.split(`/${inputDir}/`).pop() as string;
  for (let i = 0; i < componentPaths.length; i++) {
    const path = componentPaths[i];
    const filePath = componentsPathProcessor(path);
    const fileName = filePath.split('/').pop() as string;
    const fileNameOnly = fileName.replace('.ts', '');
    const componentName = camelCase(fileNameOnly.replace(/-|\./g, ' '));
    const componentNameClass = pascalCase(componentName);
    const className = `Tini${componentNameClass}Component`;
    const tagName = `tini-${fileNameOnly}`;
    const reactTagName = `Tini${componentNameClass}`;
    // dir
    const dirPaths = filePath.split('/');
    dirPaths.pop();
    await ensureDir(resolve(destPath, inputDir, ...dirPaths));
    // output .ts
    let code = await readFile(path, 'utf8');
    const rawMatching = code.match(/\/\* Raw\(([\s\S]*?)\) \*\//);
    const useBaseMatching = code.match(/\/\* UseBases\(([\s\S]*?)\) \*\//);
    const useComponentsMatching = code.match(
      /\/\* UseComponents\(([\s\S]*?)\) \*\//
    );
    const reactEventsMatching = code.match(
      /\/\* ReactEvents\(([\s\S]*?)\) \*\//
    );
    // raw contents
    const rawContents = (!rawMatching ? '' : rawMatching[1])
      .split(',')
      .map(item => item.trim());
    // base imports
    const useBaseContents = (!useBaseMatching ? '' : useBaseMatching[1])
      .split(',')
      .reduce(
        (result, item) => {
          const name = item.trim();
          if (name) {
            result.imports.push(
              `import ${name}Base from '../${STYLES_DIR}/base/${name}';`
            );
            result.styles.push(`${name}Base`);
          }
          return result;
        },
        {
          imports: [] as string[],
          styles: [] as string[],
        }
      );
    // component imports
    const useComponentsContents = (
      !useComponentsMatching ? '' : useComponentsMatching[1]
    )
      .split(',')
      .reduce(
        (result, item) => {
          const name = item.trim();
          const namePascal = pascalCase(name.replace(/-|\./g, ' '));
          const nameClass = `Tini${namePascal}Component`;
          if (name) {
            result.imports.push(`import {${nameClass}} from './${name}';`);
            result.components.push(nameClass);
          }
          return result;
        },
        {
          imports: [] as string[],
          components: [] as string[],
        }
      );
    // react events
    const reactEventsContents = (
      !reactEventsMatching ? '' : reactEventsMatching[1]
    )
      .split(',')
      .reduce(
        (result, item) => {
          const value = item.trim();
          if (value) {
            const [originalName, reactName] = value.split(':');
            result.events[reactName] = originalName;
          }
          return result;
        },
        {
          events: {} as Record<string, string>,
        }
      );
    // build content
    if (rawMatching) {
      code = code.replace(`${rawMatching[0]}\n`, '');
    }
    if (useBaseMatching) {
      code = code.replace(`${useBaseMatching[0]}\n`, '');
    }
    if (useComponentsMatching) {
      code = code.replace(`${useComponentsMatching[0]}\n`, '');
    }
    if (reactEventsMatching) {
      code = code.replace(`${reactEventsMatching[0]}\n`, '');
    }
    code = code.replace(
      /(\.\.\/styles\/([\s\S]*?)\/)|(\.\.\/styles\/)/g,
      '../styles/'
    );
    code =
      `
${useBaseContents.imports.join('\n')}
${useComponentsContents.imports.join('\n')}
import {${componentName}Style, ${componentName}Script} from '../${STYLES_DIR}/soul/${fileNameOnly}';
${
  !useComponentsMatching ? '' : "import {TiniElementComponents} from 'tinijs';"
}\n\n` + code;
    // inject components
    if (useComponentsMatching) {
      code = code.replace(
        'export class ',
        `@TiniElementComponents(${JSON.stringify(
          useComponentsContents.components
        ).replace(/"/g, '')})
export class `
      );
    }
    // inject bases
    const superClassName = rawContents[0] || 'TiniElement';
    const updatedMethodStr = 'updated() {';
    const hasUpdatedMethod = ~code.indexOf(updatedMethodStr);
    const scriptingCode = `if (${componentName}Script) ${componentName}Script(this);`;
    const newUpdatedMethod = `protected ${updatedMethodStr}\n    ${scriptingCode}\n  }\n\n`;
    code = code.replace(
      `extends ${superClassName} {\n`,
      `extends ${superClassName} {\n
static styles = [${useBaseContents.styles.join(', ')}${
        !useBaseMatching ? '' : ','
      }${componentName}Style];

${hasUpdatedMethod ? '' : newUpdatedMethod}`
    );
    if (hasUpdatedMethod) {
      code = code.replace(
        updatedMethodStr,
        updatedMethodStr + '\n    ' + scriptingCode + '\n'
      );
    }
    const reactCode = `import React from 'react';
import {createComponent} from '@lit/react';
import {${className}} from './${fileNameOnly}';
export {${className}};
export const ${reactTagName} = createComponent({
react: React,
elementClass: ${className}${
      rawContents[1] !== 'react-any-props' ? '' : ' as any'
    },
tagName: ${className}.defaultTagName,${
      !Object.keys(reactEventsContents.events).length
        ? ''
        : `\n  events: ${JSON.stringify(reactEventsContents.events)}`
    }
});\n`;
    const bundleCode = `import {customElement} from 'lit/decorators.js';
import {${className} as _${className}} from './${fileNameOnly}';
@customElement('${tagName}')
export class ${className} extends _${className} {}
`;
    await outputFile(resolve(destPath, inputDir, filePath), code);
    await outputFile(
      resolve(destPath, inputDir, filePath.replace('.ts', '.react.ts')),
      reactCode
    );
    await outputFile(
      resolve(destPath, inputDir, filePath.replace('.ts', '.bundle.ts')),
      bundleCode
    );
  }

  /*
   * B. Transpile
   */
  if (componentPaths.length) {
    const outComponentsPaths = (
      await listDir(resolve(destPath, inputDir))
    ).filter(path => !path.endsWith('.bundle.ts'));
    await transpileAndOutputFiles(
      outComponentsPaths,
      TS_CONFIG,
      `${destPath}/${inputDir}`,
      componentsPathProcessor
    );
  }
}
