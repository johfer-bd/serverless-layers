const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

const MAX_LAYER_MB_SIZE = 250;

const AbstractService = require('../AbstractService');

function getFilesizeInBytes(filename) {
  const stats = fs.statSync(filename);
  const fileSizeInBytes = stats.size;
  return fileSizeInBytes;
}

class ZipService extends AbstractService {
  package() {
    const zipFileName = this.plugin.getPathZipFileName();
    const layersDir = path.join(process.cwd(), this.plugin.settings.compileDir);

    return new Promise(resolve => {
      const oldCwd = process.cwd();

      process.chdir(`${layersDir}/layers`);
      shell.exec(`zip -r ${zipFileName} *`, { silent: true });
      process.chdir(oldCwd);

      const MB = (getFilesizeInBytes(zipFileName) / 1024 / 1024).toFixed(1);

      if (MB > MAX_LAYER_MB_SIZE) {
        this.plugin.log('Package error!');
        throw new Error(
          "Layers can't exceed the unzipped deployment package size limit of 250 MB! \n"
          + 'Read more: https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html\n\n'
        );
      }

      this.plugin.log(`Created layer package ${zipFileName} (${MB} MB)`);

      resolve();
    });
  }
}

module.exports = ZipService;
