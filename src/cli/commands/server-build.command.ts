import {resolve} from 'path';
import {blueBright} from 'chalk';
import {createHash} from 'crypto';
import * as matter from 'gray-matter';
import * as toml from 'toml';
import {decodeHTML} from 'entities';
import {minify} from 'html-minifier';

import {ERROR} from '../../lib/services/message.service';
import {FileService} from '../../lib/services/file.service';
import {TerminalService} from '../../lib/services/terminal.service';
import {
  ProjectService,
  ProjectOptions,
} from '../../lib/services/project.service';

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

  private async buildBasic({stagingPrefix, outDir}: ProjectOptions) {
    const eleventyConfigPath = resolve('content', 'eleventy.config.js');
    if (!(await this.fileService.exists(eleventyConfigPath))) {
      return console.log(
        '\n' + ERROR + `Invalid ${blueBright('basic')} solution.\n`
      );
    }
    const stagingDir = `${stagingPrefix}-content`;
    const srcPath = resolve(stagingDir);
    const destPath = resolve(outDir);
    // 11ty render
    this.terminalService.exec(
      `npx @11ty/eleventy --config="${eleventyConfigPath}"`,
      '.',
      'ignore'
    );
    // read content
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

    // create tini-content dir
    const tiniContentPath = resolve(destPath, 'tini-content');
    await this.fileService.createDir(tiniContentPath);

    // copy
    await Promise.all(
      copyPaths.map(async path => {
        const filePath = path.replace(stagingDir, `${outDir}/tini-content`);
        await this.fileService.createDir(filePath.replace(/\/[^\/]+$/, ''));
        return this.fileService.copyFile(path, filePath);
      })
    );

    // build
    const indexRecord = {} as Record<string, string>;
    const collectionRecord = {} as Record<string, any[]>;

    for (let i = 0; i < buildPaths.length; i++) {
      const path = buildPaths[i];
      const [collection, slug] = path
        .split(`/${stagingDir}/`)
        .pop()!
        .replace(/\/[^\/]+$/, '')
        .split('/');

      // process raw content
      let rawContent = await this.fileService.readText(path);
      rawContent = rawContent.replace(/(<p>\+\+\+)|(\+\+\+<\/p>)/g, '+++');
      const matterMatching = rawContent.match(/\+\+\+([\s\S]*?)\+\+\+/);
      if (!matterMatching) continue;
      const matterData = decodeHTML(matterMatching[1].replace(/\\n\\/g, '\n'));
      rawContent = rawContent.replace(matterMatching[0], `---${matterData}---`);

      // item
      const digest = createHash('sha256')
        .update(rawContent)
        .digest('base64url');
      const {content, data} = matter(rawContent, {
        engines: {
          toml: toml.parse.bind(toml),
        },
      });
      const itemFull = {
        ...(data.moredata || {}),
        ...data,
        id: digest,
        content: minify(content, {
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          decodeEntities: true,
          html5: true,
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
        resolve(tiniContentPath, `${digest}.json`),
        itemFull,
        true
      );
      indexRecord[`${collection}/${slug}`] = digest;

      // collection
      collectionRecord[collection] ||= [];
      const itemForListing = {
        ...data,
        id: digest,
        moredata: undefined,
        metadata: undefined,
      };
      delete itemForListing.moredata;
      delete itemForListing.metadata;
      collectionRecord[collection].push(itemForListing);
    }

    for (const [collection, items] of Object.entries(collectionRecord)) {
      const digest = createHash('sha256')
        .update(JSON.stringify(items))
        .digest('base64url');
      await this.fileService.createJson(
        resolve(tiniContentPath, `${digest}.json`),
        items,
        true
      );
      indexRecord[collection] = digest;
    }

    // index.json
    await this.fileService.createJson(
      resolve(tiniContentPath, 'index.json'),
      indexRecord,
      true
    );
  }
}
