const fs = require('fs');
const path = require('path');

class PythonRuntime {
  constructor(parent, runtime, runtimeDir) {
    this.parent = parent;
    this.plugin = parent.plugin;

    this.default = {
      runtime,
      runtimeDir,
      packageManager:  'pip',
      dependenciesPath: 'requirements.txt',
      compatibleRuntimes: [runtime],
      copyBeforeInstall: [],
      packageExclude: [
        'package.json',
        'package-lock.json',
        'node_modules/**',
      ]
    };

    this.commands = {
      pip: `pip install -r ${this.default.dependenciesPath} -t .`,
    };

    const localpackageJson = path.join(
      process.cwd(),
      this.default.dependenciesPath
    );

    try {
      this.localPackage = fs.readFileSync(localpackageJson).toString();
    } catch (e) {
      this.log(`Error: Can not find ${localpackageJson}!`);
      process.exit(1);
    }
  }

  async isCompatibleVersion(runtime) {
    const osVersion = await this.parent.run('python --version');
    const [runtimeVersion] = runtime.match(/[0-9].[0-9]/);
    return {
      version: osVersion,
      isCompatible: osVersion.startsWith(`Python ${runtimeVersion}`)
    };
  }

  isDiff(depsA, depsB) {
    if (!depsA) {
      return true;
    }
    return depsA !== depsB;
  }

  async hasDependencesChanged() {
    const remotePackage = await this.plugin.bucketService.downloadDependencesFile();

    let isDifferent = true;

    if (remotePackage) {
      this.plugin.log(`Comparing ${this.default.dependenciesPath} dependencies...`);
      isDifferent = await this.isDiff(remotePackage, this.localPackage);
    }

    return isDifferent;
  }
}

module.exports = PythonRuntime;
