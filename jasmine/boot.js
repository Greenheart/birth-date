/**
 Starting with version 2.0, this file "boots" Jasmine, performing all of the necessary initialization before executing the loaded environment and all of a project's specs. This file should be loaded after `jasmine.js` and `jasmine_html.js`, but before any project source files or spec files are loaded. Thus this file can also be used to customize Jasmine for a project.

 If a project is using Jasmine via the standalone distribution, this file can be customized directly. If a project is using Jasmine via the [Ruby gem][jasmine-gem], this file can be copied into the support directory via `jasmine copy_boot_js`. Other environments (e.g., Python) will have different mechanisms.

 The location of `boot.js` can be specified and/or overridden in `jasmine.yml`.

 [jasmine-gem]: http://github.com/pivotal/jasmine-gem
 */

(function() {

  /**
   * ## Require &amp; Instantiate
   *
   * Require Jasmine's core files. Specifically, this requires and attaches all of Jasmine's code to the `jasmine` reference.
   */
  window.jasmine = jasmineRequire.core(jasmineRequire);

  /**
   * Create the Jasmine environment. This is used to run all specs in a project.
   */
  var env = jasmine.getEnv();

  /**
   * ## The Global Interface
   *
   * Build up the functions that will be exposed as the Jasmine public interface. A project can customize, rename or alias any of these functions as desired, provided the implementation remains unchanged.
   */
  var jasmineInterface = jasmineRequire.interface(jasmine, env);

  /**
   * Add all of the Jasmine global/public interface to the global scope, so a project can use the public interface directly. For example, calling `describe` in specs instead of `jasmine.getEnv().describe`.
   */
  extend(window, jasmineInterface);

  /**
   * The `jsApiReporter` also receives spec results, and is used by any environment that needs to extract the results  from JavaScript.
   */
  env.addReporter(jasmineInterface.jsApiReporter)

  // A simple test reporter, based on https://stackoverflow.com/a/33795262/4183985
  function ConsoleReporter () {
    jasmineRequire.JsApiReporter.apply(this, arguments)
    this.completed = 0
    this.total = 0
    this.format = {
        heading: 'font-size: 16px; background: lightskyblue; padding: 5px 10px; color: black',
        success: 'font-size: 12px; color: green'
    }
    this.PRINT_ALL = true
    this.startTime = 0
  }

  ConsoleReporter.prototype = jasmineRequire.JsApiReporter.prototype
  ConsoleReporter.prototype.constructor = ConsoleReporter

  ConsoleReporter.prototype.specDone = function (o = {}) {
    if (o.status !== 'passed') {
      console.warn('Failed: ' + o.fullName + '\n\t' + o.failedExpectations[0].message)
    } else {
      this.completed++
      if (this.PRINT_ALL) {
        prettyLog('%c✔ ' + o.description, this.format.success)
      }
    }
  }

  ConsoleReporter.prototype.jasmineStarted = function (suiteInfo) {
    this.total = suiteInfo.totalSpecsDefined
    prettyLog('%cStarting tests...', this.format.heading)
    console.log('\n')
    this.startTime = performance.now()
  }

  ConsoleReporter.prototype.jasmineDone = function () {
    const success = this.completed === this.total
    const result = success ? '☃' : '☹'
    const background = success ? 'green' : 'red'
    const padding = success ? '0 120px' : '0 112.5px'
    prettyLog(`%c${result}`, `font-size: 50px; color: white; background: ${background}; padding: ${padding};`)
    prettyLog(`%c${this.completed}/${this.total} tests were successful! `, this.format.heading)
    console.log('Time: ' + (performance.now() - this.startTime) + ' ms')
    document.querySelector('#app .birth-date-input').focus()
    document.querySelector('#run-tests').innerText = 'Done'
  }

  function prettyLog (msg, format) {
    // Use console log formatting fallback for MS Edge.
    // https://stackoverflow.com/a/9851769/4183985
    const isEdge = !!window.StyleMedia
    if (isEdge) {
      console.log(msg.replace('%c', ''))
    } else {
      console.log(msg, format)
    }
  }

  env.addReporter(new ConsoleReporter())

  /**
   * Helper function for readability above.
   */
  function extend(destination, source) {
    for (var property in source) destination[property] = source[property];
    return destination;
  }

}());
