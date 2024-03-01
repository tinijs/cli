import {resolve} from 'pathe';
import {blueBright, green} from 'chalk';
import {createHash} from 'crypto';
import {decodeHTML} from 'entities';
import {minify} from 'html-minifier';
import * as ora from 'ora';
import * as matter from 'gray-matter';
import * as toml from 'toml';
import * as transliterate from '@sindresorhus/transliterate';
import * as slugify from '@sindresorhus/slugify';

import {ERROR} from '../../lib/services/message.service';
import {FileService} from '../../lib/services/file.service';
import {TerminalService} from '../../lib/services/terminal.service';
import {
  ProjectService,
  ProjectOptions,
} from '../../lib/services/project.service';

interface ServerBasicBuildOptions {
  collectTags?: false | {collection: string; field?: string};
}

interface ServerBasicTag {
  slug: string;
  title: string;
}

export class ServerBuildCommand {
  constructor(
    private fileService: FileService,
    private terminalService: TerminalService,
    private projectService: ProjectService
  ) {}

  async run(solutionName: string) {
    if (!solutionName || !~['basic'].indexOf(solutionName)) {
      return console.log(
        '\n' +
          ERROR +
          `Solution ${blueBright(solutionName)} is not available.\n`
      );
    }
    const options = await this.projectService.getOptions();
    // basic
    if (solutionName === 'basic') {
      return this.buildBasic(options);
    }
  }

  private async buildBasic({stagingDir, outDir}: ProjectOptions) {
    const eleventyConfigPath = resolve('content', 'eleventy.config.js');
    if (!(await this.fileService.exists(eleventyConfigPath))) {
      return console.log(
        '\n' +
          ERROR +
          `Invalid ${blueBright(
            'basic'
          )} solution (no content/eleventy.config.js found).\n`
      );
    }
    const stagingContentDir = `${stagingDir}/content`;
    const tiniContentDir = `${outDir}/tini-content`;
    const srcPath = resolve(stagingContentDir);
    const destPath = resolve(tiniContentDir);
    // clear the staging and tini-content dir
    await this.fileService.cleanDir(srcPath);
    await this.fileService.cleanDir(destPath);
    // 11ty render
    console.log('');
    const spinner = ora('Compile content using 11ty ...\n').start();
    this.terminalService.exec(
      `npx @11ty/eleventy --config="${eleventyConfigPath}"`,
      '.',
      'ignore'
    );
    // read content
    spinner.text = 'Read content from staging ...';
    const {copyPaths, buildPaths} = (
      await this.fileService.listDir(srcPath)
    ).reduce(
      (result, item) => {
        if (
          ~item.indexOf('/uploads/') ||
          ~item.indexOf(`/${stagingDir}/images/`) ||
          !item.endsWith('.html')
        ) {
          result.copyPaths.push(item);
        } else {
          result.buildPaths.push(item);
        }
        return result;
      },
      {
        copyPaths: [] as string[],
        buildPaths: [] as string[],
      }
    );

    // copy
    spinner.text = 'Copy uploaded content ...';
    await Promise.all(
      copyPaths.map(async path => {
        const filePath = path.replace(stagingDir, tiniContentDir);
        await this.fileService.createDir(filePath.replace(/\/[^/]+$/, ''));
        return this.fileService.copyFile(path, filePath);
      })
    );

    // build
    const indexRecord = {} as Record<string, string>;
    const collectionRecord = {} as Record<string, any[]>;
    const fulltextSearchRecord = {} as Record<string, Record<string, any>>;
    const collectedTagsRecord = {} as Record<
      string,
      Record<string, ServerBasicTag>
    >;

    let buildCount = 0;
    for (let i = 0; i < buildPaths.length; i++) {
      const path = buildPaths[i];
      const [collection, slug] = path
        .split(`/${stagingDir}/`)
        .pop()!
        .replace(/\/[^/]+$/, '')
        .split('/');

      spinner.text = `Build: ${green(`${collection}/${slug}`)} ...`;

      // process raw content
      let rawContent = await this.fileService.readText(path);
      rawContent = rawContent.replace(/(<p>\+\+\+)|(\+\+\+<\/p>)/g, '+++');
      const matterMatching = rawContent.match(/\+\+\+([\s\S]*?)\+\+\+/);
      if (!matterMatching) continue;
      const matterData = decodeHTML(matterMatching[1].replace(/\\n\\/g, '\n'));
      rawContent = rawContent.replace(matterMatching[0], `---${matterData}---`);
      const {content, data} = matter(rawContent, {
        engines: {
          toml: toml.parse.bind(toml),
        },
      });
      if (data.status && data.status !== 'publish' && data.status !== 'archive')
        continue;
      const buildOptions = (data.$build || {}) as ServerBasicBuildOptions;
      delete data.$build;

      // item
      const digest = createHash('sha256')
        .update(rawContent)
        .digest('base64url');
      const itemFull = {
        ...(data.moredata || {}),
        ...data,
        id: digest,
        slug,
        content: minify(content, {
          html5: true,
          decodeEntities: true,
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          removeComments: true,
          removeOptionalTags: true,
          sortAttributes: true,
          sortClassName: true,
        }),
        moredata: undefined,
      };
      delete itemFull.moredata;
      await this.fileService.createJson(
        resolve(destPath, `${digest}.json`),
        itemFull,
        true
      );
      indexRecord[`${collection}/${slug}`] = digest;

      // collection
      collectionRecord[collection] ||= [];
      const itemForListing = {
        ...data,
        id: digest,
        slug,
        moredata: undefined,
      };
      delete itemForListing.moredata;
      collectionRecord[collection].push(itemForListing);

      // fulltext search
      fulltextSearchRecord[collection] ||= {};
      fulltextSearchRecord[collection][slug] = this.buildSearchContent(
        content,
        data
      );

      // collect tags
      if (
        buildOptions.collectTags instanceof Object ||
        (data.tags && buildOptions.collectTags !== false)
      ) {
        const {collection = 'tags', field = 'tags'} =
          buildOptions.collectTags || {};
        const [rootField, nestedField] = field.split('.');
        const rawTags = ((!nestedField
          ? data[rootField]
          : data[rootField][nestedField]) || []) as (string | ServerBasicTag)[];
        if (rawTags.length) {
          collectedTagsRecord[collection] ||= {};
          rawTags.forEach(tag => {
            if (typeof tag !== 'string') {
              collectedTagsRecord[collection][tag.slug] = tag;
            } else {
              const slugMatching = tag.match(/<([\s\S]*?)>/);
              if (!slugMatching) {
                const slug = slugify(tag);
                collectedTagsRecord[collection][slug] = {
                  slug,
                  title: tag,
                };
              } else {
                const slug = slugMatching[1].trim();
                collectedTagsRecord[collection][slug] = {
                  slug,
                  title: tag.replace(slugMatching[0], '').trim(),
                };
              }
            }
          });
        }
      }

      // count build
      buildCount++;
    }

    spinner.text = 'Write collections, search and index ...';

    // collections
    for (const [collection, items] of Object.entries(collectionRecord)) {
      const digest = createHash('sha256')
        .update(JSON.stringify(items))
        .digest('base64url');
      await this.fileService.createJson(
        resolve(destPath, `${digest}.json`),
        items,
        true
      );
      indexRecord[collection] = digest;
    }

    // search
    for (const [collection, items] of Object.entries(fulltextSearchRecord)) {
      const digest = createHash('sha256')
        .update(JSON.stringify(items))
        .digest('base64url');
      await this.fileService.createJson(
        resolve(destPath, `${digest}.json`),
        items,
        true
      );
      indexRecord[`${collection}-search`] = digest;
    }

    // tags
    if (Object.keys(collectedTagsRecord).length) {
      for (const [collection, record] of Object.entries(collectedTagsRecord)) {
        const items = Object.values(record);
        const digest = createHash('sha256')
          .update(JSON.stringify(items))
          .digest('base64url');
        await this.fileService.createJson(
          resolve(destPath, `${digest}.json`),
          items,
          true
        );
        indexRecord[collection] = digest;
      }
    }

    // index
    await this.fileService.createJson(
      resolve(destPath, 'index.json'),
      indexRecord,
      true
    );

    // done
    spinner.succeed(
      `Success! Copy ${blueBright(
        copyPaths.length
      )} items and build ${blueBright(buildCount)}/${
        buildPaths.length
      } items.\n`
    );
  }

  private buildSearchContent(
    htmlContent: string,
    data: Record<string, any> = {}
  ) {
    let content = '';
    if (data.tags) content += '\n' + this.extractTagTitles(data.tags).join(' ');
    if (data.title) content += '\n' + data.title;
    if (data.name) content += '\n' + data.name;
    if (data.desc) content += '\n' + data.desc;
    if (data.excerpt) content += '\n' + data.excerpt;
    content +=
      '\n' +
      htmlContent
        .replace(/<style([\s\S]*?)<\/style>/gi, '')
        .replace(/<script([\s\S]*?)<\/script>/gi, '')
        .replace(/<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g, '');
    const segmenter = new Intl.Segmenter(['en', 'vi', 'ja'], {
      granularity: 'word',
    });
    const words = Array.from(segmenter.segment(content))
      .map(segment => transliterate(segment.segment))
      .filter(
        word =>
          word && !~'~`!@#$%^&*()+={}[];:\'"<>.,/\\?-_ \t\r\n'.indexOf(word)
      );
    return Array.from(new Set(words)).join(' ');
  }

  private extractTagTitles(
    tags: (string | Object)[] | Record<string, true | string | Object>
  ) {
    const result = [] as string[];
    if (tags instanceof Array) {
      tags.forEach(tag =>
        result.push(typeof tag === 'string' ? tag : (tag as any).title)
      );
    } else {
      for (const [slug, tag] of Object.entries(tags)) {
        result.push(
          tag === true
            ? slug
            : typeof tag === 'string'
            ? tag
            : (tag as any).title
        );
      }
    }
    return result;
  }
}
