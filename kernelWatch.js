let jupyterPaths = require('jupyter-paths');
let watch = require('watch');

let runtimeDir = jupyterPaths.jupyterRuntimeDir();

function isKernelJSON(filepath) {
  let name = path.basename(filepath);
  return name.startsWith('kernel') && name.endsWith('.json');
}

/**
 * @class KernelWatch
 * @classdesc Watches a Jupyter kernel runtime directory for changes, calling cb on change
 */
function KernelWatch(cb, directory, opts) {
  this.cb = cb;
  this.directory = directory || runtimeDir;
  this.opts = opts || {filter: isKernelJSON};

  watch.watchTree(this.directory, this.opts, this.runtimeDirUpdate);
}

kernelWatch.prototype.runtimeDirUpdate = function(f, curr, prev){
  if (typeof(f) === 'string' && isKernelJSON(f)) {
    this.cb(f, curr);
  } else if (typeof(f) === 'object') {
    for (let kernelJSON of Object.keys(f) ) {
      if (isKernelJSON(kernelJSON)) {
        this.cb(kernelJSON, f[kernelJSON]);
      }
    }
  } else { // wat
    console.err(f);
  }
};
